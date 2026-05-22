"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AccessItemInsert, AccessItem } from "@/lib/supabase/types";
import { DEMO_ACCESS_ITEMS } from "@/lib/demo-data";

export async function getAccessItems() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return DEMO_ACCESS_ITEMS;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("access_items")
    .select(`
      *,
      client:client_id ( id, company_name ),
      project:project_id ( id, project_name ),
      responsible:responsible_user_id ( id, full_name )
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createAccessItemAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  const profile = profileData as { id: string } | null;

  const insert: AccessItemInsert = {
    service_name: String(formData.get("service_name") || "").trim(),
    category: String(formData.get("category") || "Other"),
    client_id: String(formData.get("client_id") || "").trim(),
    project_id: String(formData.get("project_id") || "").trim() || null,
    access_status: String(formData.get("access_status") || "Pending"),
    priority: (formData.get("priority") as AccessItemInsert["priority"]) || "Medium",
    secure_location_ref: String(formData.get("secure_location_ref") || "").trim() || null,
    login_email: String(formData.get("login_email") || "").trim() || null,
    access_notes: String(formData.get("access_notes") || "").trim() || null,
    action_required: String(formData.get("action_required") || "").trim() || null,
    responsible_user_id: profile?.id ?? null,
    last_tested_date: null,
  };

  if (!insert.service_name || !insert.client_id) return { error: "Service name and client are required." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("access_items") as any).insert(insert);
  if (error) return { error: error.message };

  revalidatePath("/access");
  return { success: true };
}

export async function updateAccessStatusAction(id: string, status: string) {
  const supabase = await createClient();
  const update: Partial<AccessItem> = { access_status: status };
  if (status === "Tested") update.last_tested_date = new Date().toISOString().slice(0, 10);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("access_items") as any).update(update).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/access");
  return { success: true };
}

export async function updateAccessItemAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const update: Partial<AccessItem> = {
    service_name: String(formData.get("service_name") || "").trim(),
    category: String(formData.get("category") || "Other"),
    client_id: String(formData.get("client_id") || "").trim(),
    project_id: String(formData.get("project_id") || "").trim() || null,
    access_status: String(formData.get("access_status") || "Pending"),
    priority: (formData.get("priority") as AccessItem["priority"]) || "Medium",
    secure_location_ref: String(formData.get("secure_location_ref") || "").trim() || null,
    access_notes: String(formData.get("access_notes") || "").trim() || null,
    action_required: String(formData.get("action_required") || "").trim() || null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("access_items") as any).update(update).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/access");
  return { success: true };
}
