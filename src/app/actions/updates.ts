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

// Generate a ready-to-send status update from everything on a project's page.
// The admin selects a project and gets a formatted summary they can paste into
// the group chat. (Deterministic generation from project data — no posting.)
export async function generateProjectUpdate(projectId: string): Promise<{ text?: string; error?: string }> {
  if (!projectId) return { error: "Select a project first." };
  const supabase = await createClient();

  const { data: project, error: projErr } = await supabase
    .from("projects")
    .select(`
      *,
      client:client_id ( company_name ),
      manager:project_manager_id ( full_name ),
      members:project_members ( project_role, profile:user_id ( full_name ) )
    `)
    .eq("id", projectId)
    .single();

  if (projErr || !project) return { error: "Could not load that project." };

  const [blockersRes, timeRes, updatesRes] = await Promise.all([
    supabase.from("blockers").select("title, status, impact").eq("project_id", projectId),
    supabase.from("time_logs").select("hours").eq("project_id", projectId),
    supabase
      .from("client_updates")
      .select("content, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = project as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blockers = (blockersRes.data ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timeLogs = (timeRes.data ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates = (updatesRes.data ?? []) as any[];

  const totalHours = timeLogs.reduce((s, t) => s + Number(t.hours ?? 0), 0);
  const openBlockers = blockers.filter((b) => b.status !== "Resolved");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const team = (p.members ?? []).map((m: any) => m.profile?.full_name).filter(Boolean);

  const lines: string[] = [];
  lines.push(`📋 *${p.project_name}* — ${p.client?.company_name ?? "Internal"}`);
  lines.push(`Status: ${p.status} · ${p.progress_percentage}% complete`);
  if (p.expected_due_date) lines.push(`Due: ${p.expected_due_date}`);
  lines.push("");

  if (p.description) {
    lines.push(`What it is: ${p.description}`);
    lines.push("");
  }

  lines.push(`⏱️ Hours logged: ${totalHours.toFixed(1)}h${p.estimated_hours ? ` of ${p.estimated_hours}h estimated` : ""}`);
  if (team.length) lines.push(`👥 Team: ${team.join(", ")}`);
  if (p.manager?.full_name) lines.push(`Lead: ${p.manager.full_name}`);
  lines.push("");

  if (openBlockers.length) {
    lines.push(`🚧 Blockers (${openBlockers.length}):`);
    openBlockers.forEach((b) => lines.push(`  • ${b.title} (${b.impact}, ${b.status})`));
  } else {
    lines.push("✅ No open blockers.");
  }
  lines.push("");

  if (updates.length) {
    lines.push("🗒️ Recent notes:");
    updates.forEach((u) => lines.push(`  • ${u.content}`));
    lines.push("");
  }

  if (p.employee_notes) {
    lines.push(`Employee notes: ${p.employee_notes}`);
  }
  if (p.admin_notes) {
    lines.push(`Admin notes: ${p.admin_notes}`);
  }

  return { text: lines.join("\n").trim() };
}

export async function deleteUpdateAction(id: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("client_updates") as any).delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/updates");
  return { success: true };
}
