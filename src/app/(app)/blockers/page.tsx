import { getBlockers } from "@/app/actions/blockers";
import { getClients } from "@/app/actions/clients";
import { getProjects } from "@/app/actions/projects";
import { BlockersView } from "./blockers-view";
import type { Client, Project } from "@/lib/supabase/types";

export default async function BlockersPage() {
  const [blockers, clients, projects] = await Promise.all([
    getBlockers(),
    getClients(),
    getProjects(),
  ]);

  return (
    <BlockersView
      blockers={blockers as Parameters<typeof BlockersView>[0]["blockers"]}
      clients={clients as Pick<Client, "id" | "company_name">[]}
      projects={projects as Pick<Project, "id" | "project_name">[]}
    />
  );
}
