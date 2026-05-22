import { getTimeLogs } from "@/app/actions/time-logs";
import { getClients } from "@/app/actions/clients";
import { getProjects } from "@/app/actions/projects";
import { createClient } from "@/lib/supabase/server";
import { TimeLogsView } from "./time-logs-view";
import type { Client, Project } from "@/lib/supabase/types";

export default async function TimeLogsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let currentProfileId: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    currentProfileId = (profile as { id: string } | null)?.id ?? null;
  }

  const [timeLogs, clients, projects] = await Promise.all([
    getTimeLogs(),
    getClients(),
    getProjects(),
  ]);

  return (
    <TimeLogsView
      timeLogs={timeLogs as Parameters<typeof TimeLogsView>[0]["timeLogs"]}
      clients={clients as Pick<Client, "id" | "company_name">[]}
      projects={projects as Pick<Project, "id" | "project_name">[]}
      currentProfileId={currentProfileId}
    />
  );
}
