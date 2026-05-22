"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ClientAssetInsert } from "@/lib/supabase/types";
import { DEMO_ASSETS } from "@/lib/demo-data";

export async function getAssets() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return DEMO_ASSETS;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_assets")
    .select(`
      *,
      client:client_id ( id, company_name ),
      project:project_id ( id, project_name ),
      uploader:uploaded_by ( id, full_name )
    `)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createAssetAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  const profile = profileData as { id: string } | null;

  const insert: ClientAssetInsert = {
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim() || null,
    client_id: String(formData.get("client_id") || "").trim(),
    project_id: String(formData.get("project_id") || "").trim() || null,
    asset_type: String(formData.get("asset_type") || "Other"),
    file_url: null,
    external_url: String(formData.get("external_url") || "").trim() || null,
    visibility: (formData.get("visibility") as ClientAssetInsert["visibility"]) || "Internal",
    is_pinned: formData.get("is_pinned") === "true",
    provided_by_client: formData.get("provided_by_client") === "true",
    tags: formData.get("tags") ? String(formData.get("tags")).split(",").map(t => t.trim()).filter(Boolean) : [],
    uploaded_by: profile?.id ?? null,
  };

  if (!insert.title || !insert.client_id) return { error: "Title and client are required." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("client_assets") as any).insert(insert);
  if (error) return { error: error.message };

  revalidatePath("/assets");
  return { success: true };
}

export async function togglePinAssetAction(id: string, isPinned: boolean) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("client_assets") as any)
    .update({ is_pinned: !isPinned })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/assets");
  return { success: true };
}

export async function deleteAssetAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("client_assets").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/assets");
  return { success: true };
}
