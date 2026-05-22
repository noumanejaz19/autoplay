"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProjectInsert } from "@/lib/supabase/types";
import { DEMO_PROJECTS } from "@/lib/demo-data";

export async function getProjects() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return DEMO_PROJECTS;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      client:client_id ( id, company_name, contact_person_name ),
      manager:project_manager_id ( id, full_name, profile_photo_url ),
      members:project_members ( user_id, project_role, profile:user_id ( id, full_name, profile_photo_url ) )
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createProjectAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  const profile = profileData as { id: string } | null;

  const insert: ProjectInsert = {
    project_name: String(formData.get("project_name") || "").trim(),
    client_id: String(formData.get("client_id") || "").trim() || null,
    description: String(formData.get("description") || "").trim() || null,
    project_type: String(formData.get("project_type") || "").trim() || null,
    start_date: String(formData.get("start_date") || "").trim() || null,
    expected_due_date: String(formData.get("expected_due_date") || "").trim() || null,
    actual_completion_date: null,
    status: String(formData.get("status") || "Discovery"),
    priority: (formData.get("priority") as ProjectInsert["priority"]) || "Medium",
    progress_percentage: 0,
    project_manager_id: profile?.id ?? null,
    estimated_hours: formData.get("estimated_hours") ? Number(formData.get("estimated_hours")) : null,
    budget: null,
    tags: formData.get("tags") ? String(formData.get("tags")).split(",").map(t => t.trim()).filter(Boolean) : [],
    internal_notes: String(formData.get("internal_notes") || "").trim() || null,
    created_by: profile?.id ?? null,
  };

  if (!insert.project_name) return { error: "Project name is required." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: project, error } = await (supabase.from("projects") as any)
    .insert(insert)
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Auto-add creator as project member
  if (profile?.id && project?.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("project_members") as any).insert({
      project_id: project.id,
      user_id: profile.id,
      project_role: "Manager",
    });
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true, id: project?.id };
}

export async function updateProjectAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("projects") as any)
    .update({
      project_name: String(formData.get("project_name") || "").trim(),
      client_id: String(formData.get("client_id") || "").trim() || null,
      description: String(formData.get("description") || "").trim() || null,
      project_type: String(formData.get("project_type") || "").trim() || null,
      start_date: String(formData.get("start_date") || "").trim() || null,
      expected_due_date: String(formData.get("expected_due_date") || "").trim() || null,
      status: String(formData.get("status") || "Discovery"),
      priority: (formData.get("priority") as ProjectInsert["priority"]) || "Medium",
      progress_percentage: Number(formData.get("progress_percentage") || 0),
      estimated_hours: formData.get("estimated_hours") ? Number(formData.get("estimated_hours")) : null,
      tags: formData.get("tags") ? String(formData.get("tags")).split(",").map(t => t.trim()).filter(Boolean) : [],
      internal_notes: String(formData.get("internal_notes") || "").trim() || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}
