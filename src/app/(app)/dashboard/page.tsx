import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "./dashboard-view";
import type { Client, Blocker, Profile } from "@/lib/supabase/types";
import {
  DEMO_PROFILE, DEMO_CLIENTS, DEMO_PROJECTS, DEMO_TASKS,
  DEMO_BLOCKERS, DEMO_TIME_LOGS, DEMO_DELIVERABLES, DEMO_ACCESS_ITEMS,
} from "@/lib/demo-data";

export default async function DashboardPage() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    const profile = { full_name: DEMO_PROFILE.full_name };
    const clients = DEMO_CLIENTS;
    const projects = DEMO_PROJECTS;
    const today = new Date();
    const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const tasksDue = DEMO_TASKS.filter(t => t.due_date && new Date(t.due_date) <= weekEnd && t.status !== "Completed");
    const blockers = DEMO_BLOCKERS;
    const timeLogs = DEMO_TIME_LOGS;
    const deliverables = DEMO_DELIVERABLES.filter(d => d.status === "Approved");
    const accessPending = DEMO_ACCESS_ITEMS.filter(a => a.access_status === "Pending");

    const activeClients = clients.filter(c => c.status === "Active").length;
    const activeProjects = projects.filter(p => ["Active", "In Progress", "Discovery", "Planning"].includes(p.status)).length;
    const waitingOnClient = blockers.filter(b => b.needed_from === "Client").length;
    const urgentBlockers = blockers.filter(b => b.impact === "Critical" || b.impact === "High");
    const hoursThisWeek = timeLogs.reduce((sum, t) => sum + t.hours, 0);

    const teamHoursMap: Record<string, number> = {};
    timeLogs.forEach(t => {
      const name = t.user?.full_name?.split(" ")[0] ?? "Unknown";
      teamHoursMap[name] = (teamHoursMap[name] ?? 0) + t.hours;
    });
    const teamHoursData = Object.entries(teamHoursMap).map(([name, hours]) => ({ name, hours }));

    const statusCounts: Record<string, number> = {};
    projects.forEach(p => { statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1; });
    const STATUS_COLORS: Record<string, string> = {
      Active: "#6366f1", Planning: "#06b6d4", "On Hold": "#f59e0b", Completed: "#10b981",
    };
    const projectStatusData = Object.entries(statusCounts).map(([name, value]) => ({
      name, value, color: STATUS_COLORS[name] ?? "#94a3b8",
    }));

    const clientHealthData = [
      { name: "Healthy", value: clients.filter(c => c.health_status === "Healthy" || c.health_status === "Good").length, color: "#10b981" },
      { name: "At Risk", value: clients.filter(c => c.health_status === "At Risk").length, color: "#f59e0b" },
      { name: "Blocked", value: clients.filter(c => (c.health_status as string) === "Blocked").length, color: "#f43f5e" },
    ];

    return (
      <DashboardView
        profile={profile}
        stats={{
          activeClients, totalClients: clients.length,
          activeProjects, totalProjects: projects.length,
          tasksDueThisWeek: tasksDue.length,
          openBlockers: blockers.length,
          waitingOnClient,
          hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
          completedDeliverables: deliverables.length,
          accessPending: accessPending.length,
        }}
        clients={clients as Parameters<typeof DashboardView>[0]["clients"]}
        projectStatusData={projectStatusData}
        clientHealthData={clientHealthData}
        teamHoursData={teamHoursData}
        urgentBlockers={urgentBlockers as Parameters<typeof DashboardView>[0]["urgentBlockers"]}
      />
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);

  const profileQ = user
    ? supabase.from("profiles").select("full_name").eq("auth_user_id", user.id).single()
    : null;
  const clientsQ = supabase.from("clients")
    .select("*, owner:project_owner_id(full_name)")
    .neq("status", "Archived")
    .order("created_at", { ascending: false });
  const projectsQ = supabase.from("projects").select("status").neq("status", "Cancelled");
  const tasksQ = supabase.from("tasks")
    .select("id")
    .lte("due_date", weekEndStr)
    .gte("due_date", weekStartStr)
    .not("status", "eq", "Completed");
  const blockersQ = supabase.from("blockers")
    .select("*, client:client_id(company_name), responsible:responsible_user_id(full_name)")
    .eq("status", "Open");
  const timeQ = supabase.from("time_logs")
    .select("user_id, hours, profiles!inner(full_name)")
    .gte("work_date", weekStartStr)
    .lte("work_date", weekEndStr);
  const delivQ = supabase.from("deliverables").select("id").eq("status", "Approved");
  const accessQ = supabase.from("access_items").select("id").eq("access_status", "Pending");

  const [profileRes, clientsRes, projectsRes, tasksRes, blockersRes, timeRes, delivRes, accessRes] =
    await Promise.all([
      profileQ ?? Promise.resolve({ data: null as Pick<Profile, "full_name"> | null }),
      clientsQ, projectsQ, tasksQ, blockersQ, timeQ, delivQ, accessQ,
    ]);

  const profile = profileRes.data as Pick<Profile, "full_name"> | null;
  type ClientWithOwner = Client & { owner: { full_name: string } | null };
  const clients = (clientsRes.data ?? []) as ClientWithOwner[];
  type ProjectRow = { status: string };
  const projects = (projectsRes.data ?? []) as ProjectRow[];
  type BlockerWithRels = Blocker & { client: { company_name: string } | null; responsible: { full_name: string } | null };
  const blockers = (blockersRes.data ?? []) as BlockerWithRels[];
  type TimeRow = { user_id: string; hours: number; profiles: { full_name: string } | null };
  const timeLogs = (timeRes.data ?? []) as TimeRow[];

  const tasksDue = tasksRes.data ?? [];
  const deliverables = delivRes.data ?? [];
  const accessPending = accessRes.data ?? [];

  const activeClients = clients.filter(c => c.status === "Active").length;
  const activeProjects = projects.filter(p =>
    ["In Progress", "Active", "Discovery", "Setup", "Development"].includes(p.status)
  ).length;
  const waitingOnClient = blockers.filter(b => b.needed_from === "Client").length;
  const urgentBlockers = blockers.filter(b => b.impact === "Critical" || b.impact === "High");
  const hoursThisWeek = timeLogs.reduce((sum, t) => sum + t.hours, 0);

  const teamHoursMap: Record<string, number> = {};
  timeLogs.forEach(t => {
    const name = t.profiles?.full_name?.split(" ")[0] ?? "Unknown";
    teamHoursMap[name] = (teamHoursMap[name] ?? 0) + t.hours;
  });
  const teamHoursData = Object.entries(teamHoursMap).map(([name, hours]) => ({ name, hours }));

  const statusCounts: Record<string, number> = {};
  projects.forEach(p => { statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1; });
  const STATUS_COLORS: Record<string, string> = {
    "In Progress": "#6366f1", Active: "#6366f1", Discovery: "#8b5cf6",
    Planning: "#06b6d4", Setup: "#06b6d4", "Client Review": "#f59e0b",
    Completed: "#10b981", "On Hold": "#f59e0b", Cancelled: "#94a3b8",
  };
  const projectStatusData = Object.entries(statusCounts).map(([name, value]) => ({
    name, value, color: STATUS_COLORS[name] ?? "#94a3b8",
  }));

  const clientHealthData = [
    { name: "Healthy", value: clients.filter(c => c.health_status === "Healthy" || c.health_status === "Good").length, color: "#10b981" },
    { name: "At Risk", value: clients.filter(c => c.health_status === "At Risk").length, color: "#f59e0b" },
    { name: "Blocked", value: clients.filter(c => c.health_status === "Blocked").length, color: "#f43f5e" },
  ];

  return (
    <DashboardView
      profile={profile}
      stats={{
        activeClients, totalClients: clients.length,
        activeProjects, totalProjects: projects.length,
        tasksDueThisWeek: tasksDue.length,
        openBlockers: blockers.length,
        waitingOnClient,
        hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
        completedDeliverables: deliverables.length,
        accessPending: accessPending.length,
      }}
      clients={clients}
      projectStatusData={projectStatusData}
      clientHealthData={clientHealthData}
      teamHoursData={teamHoursData}
      urgentBlockers={urgentBlockers}
    />
  );
}
