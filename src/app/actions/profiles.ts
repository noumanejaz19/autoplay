"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DEMO_PROFILES, DEMO_PROFILE } from "@/lib/demo-data";

export async function getProfiles() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return DEMO_PROFILES;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true)
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

  if (!email || !fullName) return { error: "Email and name are required." };

  return {
    info: `To invite ${fullName} (${email}), go to your Supabase Dashboard > Authentication > Users > Invite User. Set their role to '${role}' in the profiles table after they accept.`
  };
}
