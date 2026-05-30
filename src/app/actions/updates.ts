"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ClientUpdateInsert } from "@/lib/supabase/types";

export async function getClientUpdates(clientId?: string) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return [];
  const supabase = await createClient();
  let q = supabase
    .from("client_updates")
    .select(`*, poster:posted_by ( id, full_name, profile_photo_url )`)
    .order("created_at", { ascending: false });

  if (clientId) q = q.eq("client_id", clientId);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createUpdateAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  const profile = profileData as { id: string } | null;

  const insert: ClientUpdateInsert = {
    client_id: String(formData.get("client_id") || "").trim(),
    project_id: String(formData.get("project_id") || "").trim() || null,
    posted_by: profile?.id ?? null,
    content: String(formData.get("content") || "").trim(),
    update_type: (formData.get("update_type") as ClientUpdateInsert["update_type"]) || "general",
  };

  if (!insert.client_id || !insert.content) return { error: "Client and message are required." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("client_updates") as any).insert(insert);
  if (error) return { error: error.message };

  revalidatePath("/updates");
  return { success: true };
}

export async function deleteUpdateAction(id: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("client_updates") as any).delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/updates");
  return { success: true };
}
