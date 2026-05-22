"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TaskInsert } from "@/lib/supabase/types";
import { DEMO_TASKS } from "@/lib/demo-data";

export async function getTasks() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return DEMO_TASKS;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(`
      *,
      assignee:assigned_to ( id, full_name, profile_photo_url ),
      project:project_id ( id, project_name ),
      client:client_id ( id, company_name )
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createTaskAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  const profile = profileData as { id: string } | null;

  const insert: TaskInsert = {
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim() || null,
    project_id: String(formData.get("project_id") || "").trim() || null,
    client_id: String(formData.get("client_id") || "").trim() || null,
    assigned_to: String(formData.get("assigned_to") || "").trim() || null,
    status: String(formData.get("status") || "To Do"),
    priority: (formData.get("priority") as TaskInsert["priority"]) || "Medium",
    due_date: String(formData.get("due_date") || "").trim() || null,
    estimated_hours: formData.get("estimated_hours") ? Number(formData.get("estimated_hours")) : null,
    tags: formData.get("tags") ? String(formData.get("tags")).split(",").map(t => t.trim()).filter(Boolean) : [],
    client_visible: formData.get("client_visible") === "true",
    internal_only: formData.get("internal_only") !== "false",
    completed_at: null,
    created_by: profile?.id ?? null,
  };

  if (!insert.title) return { error: "Task title is required." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("tasks") as any).insert(insert);
  if (error) return { error: error.message };

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTaskStatusAction(id: string, status: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("tasks") as any)
    .update({
      status,
      completed_at: status === "Completed" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTaskAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("tasks") as any)
    .update({
      title: String(formData.get("title") || "").trim(),
      description: String(formData.get("description") || "").trim() || null,
      project_id: String(formData.get("project_id") || "").trim() || null,
      client_id: String(formData.get("client_id") || "").trim() || null,
      assigned_to: String(formData.get("assigned_to") || "").trim() || null,
      status: String(formData.get("status") || "To Do"),
      priority: (formData.get("priority") as TaskInsert["priority"]) || "Medium",
      due_date: String(formData.get("due_date") || "").trim() || null,
      estimated_hours: formData.get("estimated_hours") ? Number(formData.get("estimated_hours")) : null,
      tags: formData.get("tags") ? String(formData.get("tags")).split(",").map(t => t.trim()).filter(Boolean) : [],
      completed_at: formData.get("status") === "Completed" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/tasks");
  return { success: true };
}

export async function deleteTaskAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/tasks");
  return { success: true };
}
