import { getProjects } from "@/app/actions/projects";
import { UpdatesView } from "./updates-view";

export default async function UpdatesPage() {
  const projects = await getProjects();

  // Only need id + name + client for the selector.
  const slim = (projects as Array<{ id: string; project_name: string; client?: { company_name?: string } | null }>).map((p) => ({
    id: p.id,
    project_name: p.project_name,
    client_name: p.client?.company_name ?? null,
  }));

  return <UpdatesView projects={slim} />;
}
