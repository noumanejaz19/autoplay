"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ClientDocumentInsert } from "@/lib/supabase/types";

export async function getClientDocuments(clientId: string) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_documents")
    .select("*, uploader:uploaded_by ( id, full_name )")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) return []; // table may not exist yet (migration 005 not run)
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

// Upload a document for a client into either the admin-only or shared bucket.
export async function uploadClientDocumentAction(formData: FormData) {
  const supabase = await createClient();
  const profileId = await currentProfileId();

  const clientId = String(formData.get("client_id") || "").trim();
  const visibility = String(formData.get("visibility") || "shared").trim() as ClientDocumentInsert["visibility"];
  const file = formData.get("file") as File | null;

  if (!clientId) return { error: "Client is required." };
  if (visibility !== "admin" && visibility !== "shared") return { error: "Invalid visibility." };
  if (!file || file.size === 0) return { error: "No file provided." };

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${clientId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("client-files")
    .upload(path, file, { contentType: file.type || undefined });
  if (uploadError) return { error: `Upload failed: ${uploadError.message}` };

  const { data: urlData } = supabase.storage.from("client-files").getPublicUrl(path);

  const insert: ClientDocumentInsert = {
    client_id: clientId,
    title: file.name,
    url: urlData.publicUrl,
    file_name: file.name,
    mime_type: file.type || null,
    visibility,
    uploaded_by: profileId,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("client_documents") as any).insert(insert);
  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function deleteClientDocumentAction(id: string, clientId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("client_documents").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}
