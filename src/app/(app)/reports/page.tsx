import { createClient } from "@/lib/supabase/server";
import { ReportsView } from "./reports-view";
import { DEMO_CLIENTS, DEMO_PROJECTS, DEMO_TIME_LOGS, DEMO_BLOCKERS, DEMO_DELIVERABLES } from "@/lib/demo-data";

export default async function ReportsPage() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return (
      <ReportsView
        clients={DEMO_CLIENTS.map(c => ({ id: c.id, company_name: c.company_name }))}
        allProjects={DEMO_PROJECTS.map(p => ({ id: p.id, project_name: p.project_name, status: p.status, progress_percentage: p.progress_percentage, client_id: p.client_id }))}
        allTimeLogs={DEMO_TIME_LOGS.map(t => ({ id: t.id, work_date: t.work_date, hours: t.hours, user_id: t.user_id, client_id: t.client_id, billable: t.billable, category: t.category, user: t.user ? { full_name: t.user.full_name } : null }))}
        allBlockers={DEMO_BLOCKERS.map(b => ({ id: b.id, status: b.status, impact: b.impact, client_id: b.client_id }))}
        allDeliverables={DEMO_DELIVERABLES.map(d => ({ id: d.id, status: d.status, client_id: d.client_id }))}
      />
    );
  }

  const supabase = await createClient();

  const [clientsRes, projectsRes, timeLogsRes, blockersRes, deliverablesRes] = await Promise.all([
    supabase.from("clients").select("id, company_name").neq("status", "Archived").order("company_name"),
    supabase.from("projects").select("id, project_name, status, progress_percentage, client_id").neq("status", "Cancelled"),
    supabase.from("time_logs").select("id, work_date, hours, user_id, client_id, billable, category, profiles!inner(full_name)").order("work_date", { ascending: false }),
    supabase.from("blockers").select("id, status, impact, client_id"),
    supabase.from("deliverables").select("id, status, client_id"),
  ]);

  type TLRow = { id: string; work_date: string; hours: number; user_id: string; client_id: string | null; billable: boolean; category: string; user: { full_name: string } | null };

  const rawLogs = (timeLogsRes.data ?? []) as unknown as Array<{ id: string; work_date: string; hours: number; user_id: string; client_id: string | null; billable: boolean; category: string; profiles: { full_name: string } | null }>;
  const timeLogs: TLRow[] = rawLogs.map(t => ({ ...t, user: t.profiles ? { full_name: t.profiles.full_name } : null }));

  return (
    <ReportsView
      clients={(clientsRes.data ?? []) as { id: string; company_name: string }[]}
      allProjects={(projectsRes.data ?? []) as { id: string; project_name: string; status: string; progress_percentage: number; client_id: string | null }[]}
      allTimeLogs={timeLogs}
      allBlockers={(blockersRes.data ?? []) as { id: string; status: string; impact: string; client_id: string }[]}
      allDeliverables={(deliverablesRes.data ?? []) as { id: string; status: string; client_id: string }[]}
    />
  );
}
