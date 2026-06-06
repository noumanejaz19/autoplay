"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProjectProgressLogInsert } from "@/lib/supabase/types";

export async function getProjectProgressLog(projectId: string) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_progress_log")
    .select("*, logger:logged_by ( id, full_name )")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) return []; // table may not exist yet (migration 005 not run)
  return data ?? [];
}

// Log a progress update and/or milestone. Records the new % so the change
// over time is visible, and syncs the project's headline progress_percentage.
export async function logProgressAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  const profileId = (profileData as { id: string } | null)?.id ?? null;

  const projectId = String(formData.get("project_id") || "").trim();
  if (!projectId) return { error: "Project is required." };

  const rawPct = String(formData.get("percentage") || "").trim();
  const percentage = rawPct === "" ? null : Math.max(0, Math.min(100, Number(rawPct)));
  const isMilestone = formData.get("is_milestone") === "true";
  const milestoneTitle = String(formData.get("milestone_title") || "").trim() || null;
  const note = String(formData.get("note") || "").trim() || null;

  if (percentage === null && !isMilestone && !note) {
    return { error: "Add a progress %, a milestone, or a note." };
  }
  if (isMilestone && !milestoneTitle) {
    return { error: "Give the milestone a title." };
  }

  const insert: ProjectProgressLogInsert = {
    project_id: projectId,
    percentage,
    note,
    is_milestone: isMilestone,
    milestone_title: milestoneTitle,
    logged_by: profileId,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("project_progress_log") as any).insert(insert);
  if (error) return { error: error.message };

  // Keep the project's headline progress in sync with the latest %.
  if (percentage !== null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("projects") as any).update({ progress_percentage: percentage }).eq("id", projectId);
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  return { success: true };
}
