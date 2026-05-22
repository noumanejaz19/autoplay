import { getTasks } from "@/app/actions/tasks";
import { getClients } from "@/app/actions/clients";
import { getProjects } from "@/app/actions/projects";
import { getProfiles } from "@/app/actions/profiles";
import { TasksView } from "./tasks-view";
import type { Client, Project, Profile } from "@/lib/supabase/types";

export default async function TasksPage() {
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
    />
  );
}
