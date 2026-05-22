import { getDeliverables } from "@/app/actions/deliverables";
import { getClients } from "@/app/actions/clients";
import { getProjects } from "@/app/actions/projects";
import { DeliverablesView } from "./deliverables-view";
import type { Client, Project } from "@/lib/supabase/types";

export default async function DeliverablesPage() {
  const [deliverables, clients, projects] = await Promise.all([
    getDeliverables(),
    getClients(),
    getProjects(),
  ]);

  return (
    <DeliverablesView
      deliverables={deliverables as Parameters<typeof DeliverablesView>[0]["deliverables"]}
      clients={clients as Pick<Client, "id" | "company_name">[]}
      projects={projects as Pick<Project, "id" | "project_name">[]}
    />
  );
}
