import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientDetailView } from "./client-detail-view";
import type { Client, Project, Blocker, TimeLog } from "@/lib/supabase/types";
import { getClientDocuments } from "@/app/actions/client-documents";
import { DEMO_CLIENTS, DEMO_PROJECTS, DEMO_BLOCKERS, DEMO_TIME_LOGS, DEMO_PROFILE } from "@/lib/demo-data";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    const client = DEMO_CLIENTS.find((c) => c.id === id);
    if (!client) notFound();
    const projects = DEMO_PROJECTS.filter((p) => p.client_id === id);
    const blockers = DEMO_BLOCKERS.filter((b) => b.client_id === id);
    const timeLogs = DEMO_TIME_LOGS.filter((t) => t.client_id === id);
    return (
      <ClientDetailView
        client={client as unknown as Client}
        projects={projects as unknown as Project[]}
        blockers={blockers as unknown as Blocker[]}
        timeLogs={timeLogs as unknown as TimeLog[]}
        documents={[]}
        updates={[]}
        isAdmin={DEMO_PROFILE.role === "admin"}
        currentProfileId={DEMO_PROFILE.id}
      />
    );
  }

  const supabase = await createClient();

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (clientError || !client) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  let currentProfileId: string | null = null;
  if (user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("auth_user_id", user.id)
      .single();
    const p = prof as { id: string; role: string } | null;
    isAdmin = p?.role === "admin";
    currentProfileId = p?.id ?? null;
  }

  const [projectsRes, blockersRes, timeLogsRes, updatesRes, documents] = await Promise.all([
    supabase
      .from("projects")
      .select("*, manager:project_manager_id(id, full_name)")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("blockers")
      .select("*, responsible:responsible_user_id(id, full_name)")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("time_logs")
      .select("*, user:user_id(id, full_name)")
      .eq("client_id", id)
      .order("work_date", { ascending: false }),
    supabase
      .from("client_updates")
      .select("*, poster:posted_by(id, full_name, profile_photo_url)")
      .eq("client_id", id)
      .order("update_date", { ascending: false })
      .order("created_at", { ascending: false }),
    getClientDocuments(id),
  ]);

  return (
    <ClientDetailView
      client={client as Client}
      projects={(projectsRes.data ?? []) as unknown as Project[]}
      blockers={(blockersRes.data ?? []) as unknown as Blocker[]}
      timeLogs={(timeLogsRes.data ?? []) as unknown as TimeLog[]}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      documents={(documents ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updates={(updatesRes.data ?? []) as any}
      isAdmin={isAdmin}
      currentProfileId={currentProfileId}
    />
  );
}
