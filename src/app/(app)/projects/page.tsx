import { getProjects } from "@/app/actions/projects";
import { getClients } from "@/app/actions/clients";
import { getProfiles } from "@/app/actions/profiles";
import { ProjectsView } from "./projects-view";
import type { Client, Profile } from "@/lib/supabase/types";

export default async function ProjectsPage() {
  const [projects, clients, profiles] = await Promise.all([getProjects(), getClients(), getProfiles()]);
  const team = (profiles as Profile[])
    .filter((p) => p.is_active !== false)
    .map((p) => ({ id: p.id, full_name: p.full_name, role: p.role }));
  return (
    <ProjectsView
      projects={projects as Parameters<typeof ProjectsView>[0]["projects"]}
      clients={clients as Pick<Client, "id" | "company_name">[]}
      team={team}
    />
  );
}
