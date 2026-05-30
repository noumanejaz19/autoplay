import { getTasks } from "@/app/actions/tasks";
import { getClients } from "@/app/actions/clients";
import { getProjects } from "@/app/actions/projects";
import { getProfiles } from "@/app/actions/profiles";
import { TasksView } from "./tasks-view";
import { createClient } from "@/lib/supabase/server";
import type { Client, Project, Profile } from "@/lib/supabase/types";
import { DEMO_PROFILE } from "@/lib/demo-data";

export default async function TasksPage() {
  let currentProfileId: string | null = null;

  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    currentProfileId = DEMO_PROFILE.id;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();
      currentProfileId = (data as { id: string } | null)?.id ?? null;
    }
  }

  const [tasks, clients, projects, profiles] = await Promise.all([
    getTasks(),
    getClients(),
    getProjects(),
    getProfiles(),
  ]);

  return (
    <TasksView
      tasks={tasks as Parameters<typeof TasksView>[0]["tasks"]}
      clients={clients as Pick<Client, "id" | "company_name">[]}
      projects={projects as Pick<Project, "id" | "project_name">[]}
      profiles={profiles as Pick<Profile, "id" | "full_name">[]}
      currentProfileId={currentProfileId}
    />
  );
}
