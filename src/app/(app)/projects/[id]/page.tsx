import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectDetailView } from "./project-detail-view";
import { getProjectById } from "@/app/actions/projects";
import { getProjectResources } from "@/app/actions/project-resources";
import {
  DEMO_PROJECTS, DEMO_BLOCKERS, DEMO_TIME_LOGS, DEMO_PROFILE,
} from "@/lib/demo-data";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    const project = DEMO_PROJECTS.find((p) => p.id === id);
    if (!project) notFound();
    return (
      <ProjectDetailView
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        project={project as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        blockers={DEMO_BLOCKERS.filter((b) => b.project_id === id) as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        timeLogs={DEMO_TIME_LOGS.filter((t) => t.project_id === id) as any}
        updates={[]}
        resources={[]}
        isAdmin={DEMO_PROFILE.role === "admin"}
      />
    );
  }

  const project = await getProjectById(id);
  if (!project) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();
    isAdmin = (prof as { role?: string } | null)?.role === "admin";
  }

  const [blockersRes, timeRes, updatesRes, resources] = await Promise.all([
    supabase
      .from("blockers")
      .select("*, responsible:responsible_user_id ( id, full_name )")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("time_logs")
      .select("*, user:user_id ( id, full_name, profile_photo_url )")
      .eq("project_id", id)
      .order("work_date", { ascending: false }),
    supabase
      .from("client_updates")
      .select("*, poster:posted_by ( id, full_name, profile_photo_url )")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    getProjectResources(id),
  ]);

  return (
    <ProjectDetailView
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      project={project as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      blockers={(blockersRes.data ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      timeLogs={(timeRes.data ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updates={(updatesRes.data ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resources={resources as any}
      isAdmin={isAdmin}
    />
  );
}
