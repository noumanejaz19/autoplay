import { getAssets } from "@/app/actions/assets";
import { getClients } from "@/app/actions/clients";
import { getProjects } from "@/app/actions/projects";
import { AssetsView } from "./assets-view";
import type { Client, Project } from "@/lib/supabase/types";

export default async function AssetsPage() {
  const [assets, clients, projects] = await Promise.all([
    getAssets(),
    getClients(),
    getProjects(),
  ]);

  return (
    <AssetsView
      assets={assets as Parameters<typeof AssetsView>[0]["assets"]}
      clients={clients as Pick<Client, "id" | "company_name">[]}
      projects={projects as Pick<Project, "id" | "project_name">[]}
    />
  );
}
