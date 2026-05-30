"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getPermissions(profileId: string) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_permissions")
    .select("*")
    .eq("profile_id", profileId)
    .single();
  return data ?? null;
}

export async function updatePermissionsAction(profileId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: callerData } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();
  if ((callerData as { role: string } | null)?.role !== "admin") {
    return { error: "Only admins can manage permissions." };
  }

  const allowedClientIds = formData.getAll("allowed_client_ids") as string[];

  const updates = {
    allowed_client_ids: allowedClientIds,
    can_view_all_clients: formData.get("can_view_all_clients") === "true",
    can_view_time_logs: formData.get("can_view_time_logs") === "true",
    can_view_reports: formData.get("can_view_reports") === "true",
    can_post_updates: formData.get("can_post_updates") === "true",
    can_manage_assets: formData.get("can_manage_assets") === "true",
    can_manage_tasks: formData.get("can_manage_tasks") === "true",
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("user_permissions") as any)
    .upsert({ profile_id: profileId, ...updates }, { onConflict: "profile_id" });

  if (error) return { error: error.message };
  revalidatePath("/team");
  return { success: true };
}
