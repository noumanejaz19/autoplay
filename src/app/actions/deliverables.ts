"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { DeliverableInsert } from "@/lib/supabase/types";
import { DEMO_DELIVERABLES } from "@/lib/demo-data";

export async function getDeliverables() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return DEMO_DELIVERABLES;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deliverables")
    .select(`
      *,
      client:client_id ( id, company_name ),
      project:project_id ( id, project_name ),
      creator:created_by ( id, full_name )
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createDeliverableAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  const profile = profileData as { id: string } | null;

  const insert: DeliverableInsert = {
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim() || null,
    client_id: String(formData.get("client_id") || "").trim(),
    project_id: String(formData.get("project_id") || "").trim() || null,
    deliverable_type: String(formData.get("deliverable_type") || "Other"),
    status: (formData.get("status") as DeliverableInsert["status"]) || "Draft",
    file_url: null,
    external_url: String(formData.get("external_url") || "").trim() || null,
    sent_date: null,
    approved_date: null,
    notes: String(formData.get("notes") || "").trim() || null,
    client_visible: formData.get("client_visible") !== "false",
    created_by: profile?.id ?? null,
  };

  if (!insert.title || !insert.client_id) return { error: "Title and client are required." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("deliverables") as any).insert(insert);
  if (error) return { error: error.message };

  revalidatePath("/deliverables");
  return { success: true };
}

export async function updateDeliverableStatusAction(id: string, status: string) {
  const supabase = await createClient();
  const updates: Record<string, unknown> = { status };
  if (status === "Sent") updates.sent_date = new Date().toISOString().slice(0, 10);
  if (status === "Approved") updates.approved_date = new Date().toISOString().slice(0, 10);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("deliverables") as any).update(updates).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/deliverables");
  return { success: true };
}
