import { getTimeLogs } from "@/app/actions/time-logs";
import { getClients } from "@/app/actions/clients";
import { getProjects } from "@/app/actions/projects";
import { TimeLogsView } from "./time-logs-view";
import type { Client, Project } from "@/lib/supabase/types";

export default async function TimeLogsPage() {
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
    />
  );
}
