import { getAccessItems } from "@/app/actions/access";
import { getClients } from "@/app/actions/clients";
import { getProjects } from "@/app/actions/projects";
import { AccessView } from "./access-view";
import type { Client, Project } from "@/lib/supabase/types";

export default async function AccessPage() {
  const [items, clients, projects] = await Promise.all([
    getAccessItems(),
    getClients(),
    getProjects(),
  ]);

  return (
    <AccessView
      items={items as Parameters<typeof AccessView>[0]["items"]}
      clients={clients as Pick<Client, "id" | "company_name">[]}
      projects={projects as Pick<Project, "id" | "project_name">[]}
    />
  );
}
