import { getBlockers } from "@/app/actions/blockers";
import { getClients } from "@/app/actions/clients";
import { getProjects } from "@/app/actions/projects";
import { BlockersView } from "./blockers-view";
import { createClient } from "@/lib/supabase/server";
import type { Client, Project } from "@/lib/supabase/types";
import { DEMO_PROFILE } from "@/lib/demo-data";

export default async function BlockersPage() {
  let isAdmin = false;

  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    isAdmin = DEMO_PROFILE.role === "admin";
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("profiles").select("role").eq("auth_user_id", user.id).single();
      isAdmin = (data as { role: string } | null)?.role === "admin";
    }
  }

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
      isAdmin={isAdmin}
    />
  );
}
