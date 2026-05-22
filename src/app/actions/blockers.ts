"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { BlockerInsert } from "@/lib/supabase/types";
import { DEMO_BLOCKERS } from "@/lib/demo-data";

export async function getBlockers() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return DEMO_BLOCKERS;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blockers")
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

export async function createBlockerAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  const profile = profileData as { id: string } | null;

  const insert: BlockerInsert = {
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim() || null,
    client_id: String(formData.get("client_id") || "").trim(),
    project_id: String(formData.get("project_id") || "").trim() || null,
    related_task_id: null,
    related_access_id: null,
    needed_from: (formData.get("needed_from") as BlockerInsert["needed_from"]) || "Client",
    impact: (formData.get("impact") as BlockerInsert["impact"]) || "High",
    status: (formData.get("status") as BlockerInsert["status"]) || "Open",
    responsible_user_id: profile?.id ?? null,
    requested_date: String(formData.get("requested_date") || new Date().toISOString().slice(0, 10)),
    follow_up_date: String(formData.get("follow_up_date") || "").trim() || null,
    resolved_at: null,
    resolution_notes: null,
    notes: String(formData.get("notes") || "").trim() || null,
  };

  if (!insert.title || !insert.client_id) return { error: "Title and client are required." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("blockers") as any).insert(insert);
  if (error) return { error: error.message };

  revalidatePath("/blockers");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function resolveBlockerAction(id: string, resolutionNotes?: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("blockers") as any)
    .update({
      status: "Resolved",
      resolved_at: new Date().toISOString(),
      resolution_notes: resolutionNotes || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/blockers");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateBlockerAction(id: string, formData: FormData) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("blockers") as any)
    .update({
      title: String(formData.get("title") || "").trim(),
      description: String(formData.get("description") || "").trim() || null,
      client_id: String(formData.get("client_id") || "").trim(),
      project_id: String(formData.get("project_id") || "").trim() || null,
      needed_from: (formData.get("needed_from") as BlockerInsert["needed_from"]) || "Client",
      impact: (formData.get("impact") as BlockerInsert["impact"]) || "High",
      status: (formData.get("status") as BlockerInsert["status"]) || "Open",
      follow_up_date: String(formData.get("follow_up_date") || "").trim() || null,
      notes: String(formData.get("notes") || "").trim() || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/blockers");
  return { success: true };
}
