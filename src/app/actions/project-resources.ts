"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProjectResourceInsert } from "@/lib/supabase/types";

export async function getProjectResources(projectId: string) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_resources")
    .select("*, author:added_by ( id, full_name )")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) return []; // table may not exist yet (migration 004 not run)
  return data ?? [];
}

async function currentProfileId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  return (data as { id: string } | null)?.id ?? null;
}

// Upload a dragged-in file (a document or a "needed document") for a project.
export async function uploadProjectFileAction(formData: FormData) {
  const supabase = await createClient();
  const profileId = await currentProfileId();

  const projectId = String(formData.get("project_id") || "").trim();
  const resourceType = String(formData.get("resource_type") || "document").trim() as ProjectResourceInsert["resource_type"];
  const file = formData.get("file") as File | null;

  if (!projectId) return { error: "Project is required." };
  if (!file || file.size === 0) return { error: "No file provided." };
  if (resourceType !== "document" && resourceType !== "needed_document") {
    return { error: "Invalid resource type." };
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${projectId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("project-files")
    .upload(path, file, { contentType: file.type || undefined });
  if (uploadError) return { error: `Upload failed: ${uploadError.message}` };

  const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(path);

  const insert: ProjectResourceInsert = {
    project_id: projectId,
    resource_type: resourceType,
    title: file.name,
    url: urlData.publicUrl,
    file_name: file.name,
    mime_type: file.type || null,
    added_by: profileId,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("project_resources") as any).insert(insert);
  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

// Add a Loom (or other) video link to a project.
export async function addProjectLoomAction(formData: FormData) {
  const supabase = await createClient();
  const profileId = await currentProfileId();

  const projectId = String(formData.get("project_id") || "").trim();
  const url = String(formData.get("url") || "").trim();
  const title = String(formData.get("title") || "").trim() || "Loom video";

  if (!projectId) return { error: "Project is required." };
  if (!url) return { error: "Paste the Loom link." };

  const insert: ProjectResourceInsert = {
    project_id: projectId,
    resource_type: "loom",
    title,
    url,
    file_name: null,
    mime_type: null,
    added_by: profileId,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("project_resources") as any).insert(insert);
  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function deleteProjectResourceAction(id: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("project_resources").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
