"use client";

import { useState, useTransition } from "react";
import { SectionCard } from "@/components/ui/section-card";
import { Modal, Field, Input, Textarea, Select, ModalBtn } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Plus, Clock, DollarSign, Users, BarChart2, CheckCircle2, Circle } from "lucide-react";
import type { TimeLog, Client, Project, Profile } from "@/lib/supabase/types";
import { createTimeLogAction, updateTimeLogAction, deleteTimeLogAction } from "@/app/actions/time-logs";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

type TimeLogWithRels = TimeLog & {
  user: Pick<Profile, "id" | "full_name" | "profile_photo_url"> | null;
  project: Pick<Project, "id" | "project_name"> | null;
  client: Pick<Client, "id" | "company_name"> | null;
  task: { id: string; title: string } | null;
};

const CAT_COLORS: Record<string, string> = {
  Development: "#6366f1", Research: "#8b5cf6", Deployment: "#06b6d4",
  Communication: "#f59e0b", Testing: "#10b981", Documentation: "#64748b",
  Meeting: "#f43f5e", Support: "#ec4899", Design: "#0ea5e9", Planning: "#84cc16",
};
const CATEGORIES = ["Development", "Research", "Deployment", "Communication", "Testing", "Documentation", "Meeting", "Support", "Design", "Planning", "Other"];

type Props = {
  timeLogs: TimeLogWithRels[];
  clients: Pick<Client, "id" | "company_name">[];
  projects: Pick<Project, "id" | "project_name">[];
  currentProfileId: string | null;
};

const BLANK = {
  client_id: "", project_id: "", task_id: "",
  work_date: new Date().toISOString().slice(0, 10),
  hours: "2", work_description: "", billable: "true", category: "Development",
};

export function TimeLogsView({ timeLogs, clients, projects, currentProfileId }: Props) {
  const { success, error: toastError } = useToast();
  const [memberFilter, setMemberFilter] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [editLog, setEditLog] = useState<TimeLogWithRels | null>(null);
  const [form, setForm] = useState(BLANK);
  const [isPending, startTransition] = useTransition();

  function f(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  function openEdit(log: TimeLogWithRels) {
    setForm({
      client_id: log.client_id ?? "",
      project_id: log.project_id ?? "",
      task_id: log.task_id ?? "",
      work_date: log.work_date,
      hours: String(log.hours),
      work_description: log.work_description ?? "",
      billable: String(log.billable),
      category: log.category,
    });
    setEditLog(log);
  }

  function closeModals() { setAddOpen(false); setEditLog(null); setForm(BLANK); }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = editLog
        ? await updateTimeLogAction(editLog.id, fd)
        : await createTimeLogAction(fd);
      if (res.error) { toastError(res.error); return; }
      success(editLog ? "Time log updated." : "Time logged.");
      closeModals();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteTimeLogAction(id);
      if (res.error) toastError(res.error);
      else { success("Time log deleted."); closeModals(); }
    });
  }

  // Aggregations
  const billableTotal = timeLogs.filter(t => t.billable).reduce((s, t) => s + t.hours, 0);
  const nonBillableTotal = timeLogs.filter(t => !t.billable).reduce((s, t) => s + t.hours, 0);

  const clientHoursMap: Record<string, number> = {};
  timeLogs.forEach(t => {
    const n = t.client?.company_name ?? "Internal";
    clientHoursMap[n] = (clientHoursMap[n] ?? 0) + t.hours;
  });
  const clientHoursData = Object.entries(clientHoursMap).map(([name, hours]) => ({ name: name.split(" ")[0], hours }));

  const memberHoursMap: Record<string, number> = {};
  timeLogs.forEach(t => {
    const n = t.user?.full_name ?? "Unknown";
    memberHoursMap[n] = (memberHoursMap[n] ?? 0) + t.hours;
  });
  const memberHoursData = Object.entries(memberHoursMap).map(([name, hours]) => ({ name: name.split(" ")[0], hours }));

  const categoryMap: Record<string, number> = {};
  timeLogs.forEach(t => { categoryMap[t.category] = (categoryMap[t.category] ?? 0) + t.hours; });
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value, color: CAT_COLORS[name] ?? "#94a3b8" }));

  const members = Array.from(new Set(timeLogs.map(t => t.user?.full_name ?? "Unknown")));
  const filtered = memberFilter === "All" ? timeLogs : timeLogs.filter(t => (t.user?.full_name ?? "Unknown") === memberFilter);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Time Logs</h1>
          <p className="text-slate-500 text-sm mt-1">{timeLogs.length} entries · {(billableTotal + nonBillableTotal).toFixed(1)}h total</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-indigo text-white text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Log Time
        </button>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Hours", value: `${(billableTotal + nonBillableTotal).toFixed(1)}h`, icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Billable", value: `${billableTotal.toFixed(1)}h`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Non-Billable", value: `${nonBillableTotal.toFixed(1)}h`, icon: Circle, color: "text-slate-600", bg: "bg-slate-50" },
          { label: "Team Members", value: members.length, icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 flex items-center gap-3`}>
            <s.icon className={`w-5 h-5 ${s.color}`} />
            <div>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {timeLogs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SectionCard title="Hours by Client" icon={BarChart2} className="lg:col-span-2">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientHoursData} barSize={24}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                  <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
          <SectionCard title="By Category" icon={Clock}>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                    {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 mt-2">
              {categoryData.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-500 flex-1">{d.name}</span>
                  <span className="font-semibold text-slate-700">{d.value.toFixed(1)}h</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Log table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Filter by member:</span>
          <div className="flex gap-1 flex-wrap">
            {["All", ...members].map(m => (
              <button key={m} onClick={() => setMemberFilter(m)} className={cn("text-xs px-2.5 py-1 rounded-lg font-medium transition-colors", memberFilter === m ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{m.split(" ")[0]}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Clock className="w-12 h-12 mx-auto text-slate-200 mb-4" />
            <h3 className="text-slate-700 font-medium">No time logs yet</h3>
            <p className="text-slate-400 text-sm mt-1">Start logging time to track your work.</p>
            <button onClick={() => setAddOpen(true)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-indigo text-white text-sm font-medium">
              <Plus className="w-4 h-4" /> Log Time
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[100px_1fr_120px_100px_80px_80px_60px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <div>Date</div><div>Description</div><div>Member</div><div>Client</div><div>Category</div><div>Hours</div><div />
            </div>
            {filtered.map(log => (
              <div key={log.id} className="grid grid-cols-[100px_1fr_120px_100px_80px_80px_60px] gap-4 px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors items-center">
                <p className="text-xs text-slate-500">{log.work_date}</p>
                <div>
                  <p className="text-sm text-slate-800 truncate">{log.work_description ?? "—"}</p>
                  <p className="text-xs text-slate-400 truncate">{log.project?.project_name ?? log.client?.company_name ?? "—"}</p>
                </div>
                <p className="text-xs text-slate-600 truncate">{log.user?.full_name?.split(" ")[0] ?? "—"}</p>
                <p className="text-xs text-slate-500 truncate">{log.client?.company_name ?? "—"}</p>
                <div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${CAT_COLORS[log.category] ?? "#94a3b8"}20`, color: CAT_COLORS[log.category] ?? "#64748b" }}>
                    {log.category}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-slate-800">{log.hours}h</span>
                  {log.billable ? <DollarSign className="w-3 h-3 text-emerald-500" /> : null}
                </div>
                <button onClick={() => openEdit(log)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Edit</button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={addOpen || !!editLog}
        onClose={closeModals}
        title={editLog ? "Edit Time Log" : "Log Time"}
        subtitle={editLog ? `${editLog.work_date} — ${editLog.hours}h` : "Record hours worked for a client or project"}
        size="lg"
        footer={
          <>
            <ModalBtn variant="secondary" onClick={closeModals}>Cancel</ModalBtn>
            {editLog && (
              <ModalBtn variant="danger" onClick={() => handleDelete(editLog.id)} disabled={isPending}>Delete</ModalBtn>
            )}
            <ModalBtn form="timelog-form" type="submit" disabled={isPending}>
              {isPending ? "Saving…" : editLog ? "Save Changes" : "Log Time"}
            </ModalBtn>
          </>
        }
      >
        <form id="timelog-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Date" required>
              <Input name="work_date" type="date" value={form.work_date} onChange={e => f("work_date", e.target.value)} required />
            </Field>
            <Field label="Hours" required>
              <Input name="hours" type="number" min="0.25" step="0.25" value={form.hours} onChange={e => f("hours", e.target.value)} required />
            </Field>
            <Field label="Client">
              <Select name="client_id" value={form.client_id} onChange={e => f("client_id", e.target.value)}>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </Select>
            </Field>
            <Field label="Project">
              <Select name="project_id" value={form.project_id} onChange={e => f("project_id", e.target.value)}>
                <option value="">Select project...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
              </Select>
            </Field>
            <Field label="Category">
              <Select name="category" value={form.category} onChange={e => f("category", e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Billable">
              <Select name="billable" value={form.billable} onChange={e => f("billable", e.target.value)}>
                <option value="true">Billable</option>
                <option value="false">Non-Billable</option>
              </Select>
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea name="work_description" placeholder="What did you work on?" value={form.work_description} onChange={e => f("work_description", e.target.value)} />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
