"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TimeLogInsert } from "@/lib/supabase/types";
import { DEMO_TIME_LOGS } from "@/lib/demo-data";

export async function getTimeLogs() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return DEMO_TIME_LOGS;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("time_logs")
    .select(`
      *,
      user:user_id ( id, full_name, profile_photo_url ),
      project:project_id ( id, project_name ),
      client:client_id ( id, company_name ),
      task:task_id ( id, title )
    `)
    .order("work_date", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createTimeLogAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  const profile = profileData as { id: string } | null;

  if (!profile) return { error: "Profile not found." };

  const description = String(formData.get("work_description") || "").trim();
  if (!description) return { error: "Description is required." };

  // Upload recording if provided
  let recordingUrl: string | null = null;
  const recordingFile = formData.get("recording_file") as File | null;
  if (recordingFile && recordingFile.size > 0) {
    const ext = recordingFile.name.split(".").pop() ?? "mp4";
    const path = `${profile.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("time-log-recordings")
      .upload(path, recordingFile, { contentType: recordingFile.type });
    if (uploadError) return { error: `Upload failed: ${uploadError.message}` };
    const { data: urlData } = supabase.storage.from("time-log-recordings").getPublicUrl(path);
    recordingUrl = urlData.publicUrl;
  }

  const insert: TimeLogInsert = {
    user_id: profile.id,
    client_id: String(formData.get("client_id") || "").trim() || null,
    project_id: String(formData.get("project_id") || "").trim() || null,
    task_id: String(formData.get("task_id") || "").trim() || null,
    work_date: String(formData.get("work_date") || new Date().toISOString().slice(0, 10)),
    hours: Number(formData.get("hours") || 1),
    work_description: description,
    category: String(formData.get("category") || "Development"),
    billable: formData.get("billable") !== "false",
    approved: false,
    approved_by: null,
    recording_url: recordingUrl,
  };

  if (!insert.hours || insert.hours <= 0) return { error: "Hours must be greater than 0." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("time_logs") as any).insert(insert);
  if (error) return { error: error.message };

  revalidatePath("/time-logs");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTimeLogAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("time_logs") as any)
    .update({
      client_id: String(formData.get("client_id") || "").trim() || null,
      project_id: String(formData.get("project_id") || "").trim() || null,
      task_id: String(formData.get("task_id") || "").trim() || null,
      work_date: String(formData.get("work_date") || ""),
      hours: Number(formData.get("hours") || 1),
      work_description: String(formData.get("work_description") || "").trim() || null,
      category: String(formData.get("category") || "Development"),
      billable: formData.get("billable") !== "false",
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/time-logs");
  return { success: true };
}

export async function deleteTimeLogAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("time_logs").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/time-logs");
  return { success: true };
}
