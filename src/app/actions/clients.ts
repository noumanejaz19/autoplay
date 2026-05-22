"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ClientInsert } from "@/lib/supabase/types";
import { DEMO_CLIENTS } from "@/lib/demo-data";

export async function getClients() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return DEMO_CLIENTS;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select(`
      *,
      owner:project_owner_id ( id, full_name, profile_photo_url )
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createClientAction(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  const profile = profileData as { id: string } | null;

  const insert: ClientInsert = {
    company_name: String(formData.get("company_name") || "").trim(),
    contact_person_name: String(formData.get("contact_person_name") || "").trim(),
    contact_email: String(formData.get("contact_email") || "").trim() || null,
    contact_phone: String(formData.get("contact_phone") || "").trim() || null,
    whatsapp: String(formData.get("whatsapp") || "").trim() || null,
    timezone: String(formData.get("timezone") || "").trim() || null,
    preferred_channel: (formData.get("preferred_channel") as ClientInsert["preferred_channel"]) || "Email",
    industry: String(formData.get("industry") || "").trim() || null,
    website: String(formData.get("website") || "").trim() || null,
    project_owner_id: null,
    priority: (formData.get("priority") as ClientInsert["priority"]) || "Medium",
    status: (formData.get("status") as ClientInsert["status"]) || "Active",
    health_status: (formData.get("health_status") as ClientInsert["health_status"]) || "Healthy",
    internal_notes: String(formData.get("internal_notes") || "").trim() || null,
    created_by: profile?.id ?? null,
  };

  if (!insert.company_name || !insert.contact_person_name) {
    return { error: "Company name and contact person are required." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("clients") as any).insert(insert);
  if (error) return { error: error.message };

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateClientAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("clients") as any)
    .update({
      company_name: String(formData.get("company_name") || "").trim(),
      contact_person_name: String(formData.get("contact_person_name") || "").trim(),
      contact_email: String(formData.get("contact_email") || "").trim() || null,
      contact_phone: String(formData.get("contact_phone") || "").trim() || null,
      whatsapp: String(formData.get("whatsapp") || "").trim() || null,
      timezone: String(formData.get("timezone") || "").trim() || null,
      preferred_channel: (formData.get("preferred_channel") as ClientInsert["preferred_channel"]) || "Email",
      industry: String(formData.get("industry") || "").trim() || null,
      website: String(formData.get("website") || "").trim() || null,
      priority: (formData.get("priority") as ClientInsert["priority"]) || "Medium",
      status: (formData.get("status") as ClientInsert["status"]) || "Active",
      health_status: (formData.get("health_status") as ClientInsert["health_status"]) || "Healthy",
      internal_notes: String(formData.get("internal_notes") || "").trim() || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function archiveClientAction(id: string) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("clients") as any)
    .update({ status: "Archived" })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { success: true };
}
