import { getProjects } from "@/app/actions/projects";
import { getClients } from "@/app/actions/clients";
import { ProjectsView } from "./projects-view";
import type { Client } from "@/lib/supabase/types";

export default async function ProjectsPage() {
  const [projects, clients] = await Promise.all([getProjects(), getClients()]);
  return (
    <ProjectsView
      projects={projects as Parameters<typeof ProjectsView>[0]["projects"]}
      clients={clients as Pick<Client, "id" | "company_name">[]}
    />
  );
}
