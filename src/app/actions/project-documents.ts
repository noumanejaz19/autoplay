"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProjectDocumentInsert } from "@/lib/supabase/types";

export async function getProjectDocuments(projectId: string) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_documents")
    .select("*")
    .eq("project_id", projectId);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertProjectDocumentAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  const profile = profileData as { id: string } | null;

  const projectId = String(formData.get("project_id") || "").trim();
  const sectionType = String(formData.get("section_type") || "").trim() as ProjectDocumentInsert["section_type"];

  if (!projectId || !sectionType) return { error: "Project and section are required." };

  const upsert: ProjectDocumentInsert = {
    project_id: projectId,
    section_type: sectionType,
    notes: String(formData.get("notes") || "").trim() || null,
    link_url: String(formData.get("link_url") || "").trim() || null,
    link_title: String(formData.get("link_title") || "").trim() || null,
    updated_by: profile?.id ?? null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("project_documents") as any)
    .upsert(upsert, { onConflict: "project_id,section_type" });

  if (error) return { error: error.message };

  revalidatePath("/projects");
  return { success: true };
}
