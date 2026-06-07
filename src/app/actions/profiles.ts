"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DEMO_PROFILES, DEMO_PROFILE } from "@/lib/demo-data";

export async function getProfiles() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return DEMO_PROFILES;
  const supabase = await createClient();
  // Return all profiles (active and disabled) so admin can manage them
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCurrentProfile() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return DEMO_PROFILE;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  return (data as Record<string, unknown> | null);
}

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  const profile = profileData as { id: string } | null;

  if (!profile) return { error: "Profile not found." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("profiles") as any)
    .update({
      full_name: String(formData.get("full_name") || "").trim(),
      job_title: String(formData.get("job_title") || "").trim() || null,
      department: String(formData.get("department") || "").trim() || null,
      phone: String(formData.get("phone") || "").trim() || null,
      timezone: String(formData.get("timezone") || "UTC"),
      location: String(formData.get("location") || "").trim() || null,
      bio: String(formData.get("bio") || "").trim() || null,
      skills: formData.get("skills") ? String(formData.get("skills")).split(",").map(s => s.trim()).filter(Boolean) : [],
      years_experience: formData.get("years_experience") ? Number(formData.get("years_experience")) : 0,
      linkedin_url: String(formData.get("linkedin_url") || "").trim() || null,
      portfolio_url: String(formData.get("portfolio_url") || "").trim() || null,
      availability_status: (formData.get("availability_status") as "Available" | "Busy" | "Away" | "On Leave") || "Available",
    })
    .eq("id", profile.id);

  if (error) return { error: error.message };

  revalidatePath("/team");
  revalidatePath("/settings");
  return { success: true };
}

export async function updateProfilePhotoAction(profileId: string, photoUrl: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("profiles") as any)
    .update({ profile_photo_url: photoUrl })
    .eq("id", profileId);

  if (error) return { error: error.message };

  revalidatePath("/team");
  revalidatePath("/settings");
  return { success: true };
}

export async function inviteUserAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: callerData } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();
  const callerProfile = callerData as { role: string } | null;

  if (callerProfile?.role !== "admin") {
    return { error: "Only admins can invite users." };
  }

  const email = String(formData.get("email") || "").trim();
  const fullName = String(formData.get("full_name") || "").trim();
  const role = String(formData.get("role") || "user");
  const jobTitle = String(formData.get("job_title") || "").trim() || null;
  const department = String(formData.get("department") || "").trim() || null;

  if (!email || !fullName) return { error: "Email and name are required." };

  const admin = createAdminClient();

  // Send the invite email via Supabase Auth
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    // must_set_password flags them so the app forces a set-password step on
    // first entry (more reliable than depending on the redirect URL surviving).
    data: { full_name: fullName, must_set_password: true },
    // Client page that reads the invite tokens from the URL hash (implicit
    // flow) and establishes the session, then routes to set-password.
    redirectTo: `${appUrl}/auth/accept`,
  });

  if (inviteError) return { error: inviteError.message };

  // Create the profile row for the invited user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from("profiles") as any).insert({
    auth_user_id: inviteData.user?.id ?? null,
    full_name: fullName,
    email,
    role: role as "admin" | "user",
    job_title: jobTitle,
    department,
    timezone: "UTC",
    availability_status: "Available",
    is_active: true,
    years_experience: 0,
    skills: [],
    certifications: [],
  });

  revalidatePath("/team");
  return { success: true, message: `Invite sent to ${email}. They will receive an email to set their password.` };
}

// Create a team member's account directly with a password — no email sent.
// Reliable alternative to email invites (avoids SMTP rate limits / link flows).
// The account is usable immediately; the admin shares the password.
export async function createUserWithPasswordAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: callerData } = await supabase
    .from("profiles").select("role").eq("auth_user_id", user.id).single();
  if ((callerData as { role: string } | null)?.role !== "admin") {
    return { error: "Only admins can add users." };
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const fullName = String(formData.get("full_name") || "").trim();
  const role = String(formData.get("role") || "user");
  const jobTitle = String(formData.get("job_title") || "").trim() || null;
  const department = String(formData.get("department") || "").trim() || null;
  const password = String(formData.get("password") || "");

  if (!email || !fullName) return { error: "Email and name are required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // mark verified so they can log in right away
    user_metadata: { full_name: fullName, role },
  });
  if (error) return { error: error.message };

  const authUserId = created.user?.id;
  if (!authUserId) return { error: "Could not create the account." };

  // A DB trigger creates a base profile row on signup — upsert the full details.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (admin.from("profiles") as any).upsert({
    auth_user_id: authUserId,
    full_name: fullName,
    email,
    role: role as "admin" | "user",
    job_title: jobTitle,
    department,
    timezone: "UTC",
    availability_status: "Available",
    is_active: true,
    years_experience: 0,
    skills: [],
    certifications: [],
  }, { onConflict: "auth_user_id" });
  if (profileError) return { error: profileError.message };

  revalidatePath("/team");
  return { success: true, message: `Account created for ${fullName}. Share the password with them — they can log in now.` };
}

async function getCallerIsAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isAdmin: false, supabase };
  const { data } = await supabase.from("profiles").select("role").eq("auth_user_id", user.id).single();
  return { isAdmin: (data as { role: string } | null)?.role === "admin", supabase };
}

export async function disableUserAction(profileId: string) {
  const { isAdmin, supabase } = await getCallerIsAdmin();
  if (!isAdmin) return { error: "Only admins can disable users." };

  const { data: profileData } = await supabase
    .from("profiles").select("auth_user_id, role").eq("id", profileId).single();
  const profile = profileData as { auth_user_id: string; role: string } | null;
  if (!profile) return { error: "Profile not found." };
  if (profile.role === "admin") return { error: "Cannot disable an admin account." };

  const admin = createAdminClient();
  // Ban for 100 years — effectively disabled but all data preserved
  const { error: banError } = await admin.auth.admin.updateUserById(profile.auth_user_id, {
    ban_duration: "876600h",
  });
  if (banError) return { error: banError.message };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from("profiles") as any).update({ is_active: false }).eq("id", profileId);

  revalidatePath("/team");
  return { success: true };
}

export async function reactivateUserAction(profileId: string) {
  const { isAdmin } = await getCallerIsAdmin();
  if (!isAdmin) return { error: "Only admins can reactivate users." };

  const supabase = await createClient();
  const { data: profileData } = await supabase
    .from("profiles").select("auth_user_id").eq("id", profileId).single();
  const profile = profileData as { auth_user_id: string } | null;
  if (!profile) return { error: "Profile not found." };

  const admin = createAdminClient();
  const { error: unbanError } = await admin.auth.admin.updateUserById(profile.auth_user_id, {
    ban_duration: "none",
  });
  if (unbanError) return { error: unbanError.message };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from("profiles") as any).update({ is_active: true }).eq("id", profileId);

  revalidatePath("/team");
  return { success: true };
}

// Admin-only: set/reset a team member's password so they can log in.
// Only admins can change a user's password.
export async function resetUserPasswordAction(profileId: string, newPassword: string) {
  const { isAdmin, supabase } = await getCallerIsAdmin();
  if (!isAdmin) return { error: "Only admins can reset passwords." };

  if (!newPassword || newPassword.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const { data: profileData } = await supabase
    .from("profiles").select("auth_user_id").eq("id", profileId).single();
  const profile = profileData as { auth_user_id: string | null } | null;
  if (!profile?.auth_user_id) return { error: "This member has no auth account yet." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(profile.auth_user_id, {
    password: newPassword,
  });
  if (error) return { error: error.message };

  revalidatePath("/team");
  return { success: true };
}

export async function deleteUserAction(profileId: string) {
  const { isAdmin } = await getCallerIsAdmin();
  if (!isAdmin) return { error: "Only admins can delete users." };

  const supabase = await createClient();
  const { data: profileData } = await supabase
    .from("profiles").select("auth_user_id, role").eq("id", profileId).single();
  const profile = profileData as { auth_user_id: string; role: string } | null;
  if (!profile) return { error: "Profile not found." };
  if (profile.role === "admin") return { error: "Cannot delete an admin account." };

  const admin = createAdminClient();
  // Deleting the auth user cascades to the profile row via FK
  const { error: deleteError } = await admin.auth.admin.deleteUser(profile.auth_user_id);
  if (deleteError) return { error: deleteError.message };

  revalidatePath("/team");
  return { success: true };
}
