"use client";

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import { SectionCard } from "@/components/ui/section-card";
import { Modal, Field, Input, Textarea, Select, ModalBtn } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  Plus, Clock, Users, BarChart2, DollarSign, Circle,
  Upload, X, Link as LinkIcon, Play, Square, Timer, Image as ImageIcon,
} from "lucide-react";
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

const TIMER_KEY = "autoplay_active_timer";

interface TimerState {
  startedAt: number;
  description: string;
  clientId: string;
  projectId: string;
  category: string;
}

function formatTimer(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type Props = {
  timeLogs: TimeLogWithRels[];
  clients: Pick<Client, "id" | "company_name">[];
  projects: Pick<Project, "id" | "project_name">[];
};

const BLANK = {
  client_id: "", project_id: "", task_id: "",
  work_date: new Date().toISOString().slice(0, 10),
  hours: "2", work_description: "", billable: "true", category: "Development",
};

export function TimeLogsView({ timeLogs, clients, projects }: Props) {
  const { success, error: toastError } = useToast();
  const [memberFilter, setMemberFilter] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [editLog, setEditLog] = useState<TimeLogWithRels | null>(null);
  const [form, setForm] = useState(BLANK);
  const [recordingFile, setRecordingFile] = useState<File | null>(null);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isShotDragging, setIsShotDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shotInputRef = useRef<HTMLInputElement>(null);

  // ── Timer state ──────────────────────────────────────────────────────────
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [timerForm, setTimerForm] = useState({ description: "", clientId: "", projectId: "", category: "Development" });
  const [showStopModal, setShowStopModal] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore timer from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TIMER_KEY);
      if (!raw) return;
      const saved: TimerState = JSON.parse(raw);
      const elapsed = Math.floor((Date.now() - saved.startedAt) / 1000);
      setTimerStart(saved.startedAt);
      setTimerElapsed(elapsed);
      setTimerRunning(true);
      setTimerForm({
        description: saved.description,
        clientId: saved.clientId,
        projectId: saved.projectId,
        category: saved.category,
      });
    } catch {
      localStorage.removeItem(TIMER_KEY);
    }
  }, []);

  // Live counter
  useEffect(() => {
    if (timerRunning && timerStart !== null) {
      intervalRef.current = setInterval(() => {
        setTimerElapsed(Math.floor((Date.now() - timerStart) / 1000));
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning, timerStart]);

  function startTimer() {
    if (!timerForm.description.trim()) {
      toastError("Add a description before starting the timer.");
      return;
    }
    const now = Date.now();
    setTimerStart(now);
    setTimerElapsed(0);
    setTimerRunning(true);
    const state: TimerState = {
      startedAt: now,
      description: timerForm.description,
      clientId: timerForm.clientId,
      projectId: timerForm.projectId,
      category: timerForm.category,
    };
    localStorage.setItem(TIMER_KEY, JSON.stringify(state));
  }

  function stopTimer() {
    setTimerRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setShowStopModal(true);
  }

  function discardTimer() {
    setTimerRunning(false);
    setTimerStart(null);
    setTimerElapsed(0);
    setShowStopModal(false);
    setTimerForm({ description: "", clientId: "", projectId: "", category: "Development" });
    localStorage.removeItem(TIMER_KEY);
  }

  function saveTimer() {
    const rawHours = timerElapsed / 3600;
    const hours = Math.max(0.25, Math.round(rawHours * 4) / 4);
    const fd = new FormData();
    fd.set("work_date", new Date().toISOString().slice(0, 10));
    fd.set("hours", String(hours));
    fd.set("client_id", timerForm.clientId);
    fd.set("project_id", timerForm.projectId);
    fd.set("category", timerForm.category);
    fd.set("work_description", timerForm.description);
    fd.set("billable", "true");

    startTransition(async () => {
      const res = await createTimeLogAction(fd);
      if (res.error) { toastError(res.error); return; }
      success(`Timer saved — ${hours}h logged.`);
      discardTimer();
    });
  }

  // ── Manual log form ──────────────────────────────────────────────────────
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
    setRecordingFile(null);
    setScreenshots([]);
    setEditLog(log);
  }

  function closeModals() { setAddOpen(false); setEditLog(null); setForm(BLANK); setRecordingFile(null); setScreenshots([]); }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) setRecordingFile(file);
    else toastError("Please drop a video file.");
  }, [toastError]);

  const addScreenshots = useCallback((files: FileList | null) => {
    if (!files) return;
    const images = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (images.length === 0) { toastError("Please drop image files (screenshots)."); return; }
    setScreenshots(prev => [...prev, ...images]);
  }, [toastError]);

  const onShotDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsShotDragging(false);
    addScreenshots(e.dataTransfer.files);
  }, [addScreenshots]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.work_description.trim()) {
      toastError("Description is required — describe what you worked on.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    if (recordingFile) fd.set("recording_file", recordingFile);
    screenshots.forEach(file => fd.append("screenshot_files", file));
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

  // ── Chart data ───────────────────────────────────────────────────────────
  const billableTotal = timeLogs.filter(t => t.billable).reduce((s, t) => s + t.hours, 0);
  const nonBillableTotal = timeLogs.filter(t => !t.billable).reduce((s, t) => s + t.hours, 0);

  const clientHoursMap: Record<string, number> = {};
  timeLogs.forEach(t => {
    const n = t.client?.company_name ?? "Internal";
    clientHoursMap[n] = (clientHoursMap[n] ?? 0) + t.hours;
  });
  const clientHoursData = Object.entries(clientHoursMap).map(([name, hours]) => ({ name: name.split(" ")[0], hours }));

  const categoryMap: Record<string, number> = {};
  timeLogs.forEach(t => { categoryMap[t.category] = (categoryMap[t.category] ?? 0) + t.hours; });
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value, color: CAT_COLORS[name] ?? "#94a3b8" }));

  const members = Array.from(new Set(timeLogs.map(t => t.user?.full_name ?? "Unknown")));
  const filtered = memberFilter === "All" ? timeLogs : timeLogs.filter(t => (t.user?.full_name ?? "Unknown") === memberFilter);

  const activeClient = clients.find(c => c.id === timerForm.clientId);
  const activeProject = projects.find(p => p.id === timerForm.projectId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Time Logs</h1>
          <p className="text-slate-500 text-sm mt-1">{timeLogs.length} entries · {(billableTotal + nonBillableTotal).toFixed(1)}h total</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-indigo text-white text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Log Time Manually
        </button>
      </div>

      {/* ── Timer Widget ─────────────────────────────────────────────────── */}
      {timerRunning ? (
        /* Running state */
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex h-10 w-10 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-20" />
                <Timer className="w-5 h-5 text-white relative" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Timer running</p>
                <p className="font-semibold text-sm truncate max-w-72">{timerForm.description || "No description"}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {activeClient && <span className="text-white/70 text-xs">{activeClient.company_name}</span>}
                  {activeProject && <><span className="text-white/40 text-xs">·</span><span className="text-white/70 text-xs">{activeProject.project_name}</span></>}
                  <span className="text-white/40 text-xs">·</span>
                  <span className="text-white/70 text-xs">{timerForm.category}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-4xl font-mono font-bold tracking-wider tabular-nums">{formatTimer(timerElapsed)}</p>
              <button
                onClick={stopTimer}
                className="flex items-center gap-2 px-5 py-3 bg-white text-indigo-700 rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors"
              >
                <Square className="w-4 h-4 fill-current" /> Stop & Save
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Idle state */
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Timer className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold text-slate-700">Start Timer</span>
            <span className="text-xs text-slate-400 ml-1">— track time like Clockify</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="What are you working on?"
              value={timerForm.description}
              onChange={e => setTimerForm(p => ({ ...p, description: e.target.value }))}
              onKeyDown={e => { if (e.key === "Enter") startTimer(); }}
              className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-slate-400"
            />
            <select
              value={timerForm.clientId}
              onChange={e => setTimerForm(p => ({ ...p, clientId: e.target.value }))}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-white"
            >
              <option value="">Client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
            <select
              value={timerForm.projectId}
              onChange={e => setTimerForm(p => ({ ...p, projectId: e.target.value }))}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-white"
            >
              <option value="">Project...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
            </select>
            <select
              value={timerForm.category}
              onChange={e => setTimerForm(p => ({ ...p, category: e.target.value }))}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 bg-white"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <button
              onClick={startTimer}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" /> Start
            </button>
          </div>
        </div>
      )}

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
            <p className="text-slate-400 text-sm mt-1">Start the timer above or log time manually.</p>
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
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-400 truncate">{log.project?.project_name ?? log.client?.company_name ?? "—"}</p>
                    {log.recording_url && (
                      <a href={log.recording_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-[10px] text-indigo-500 hover:text-indigo-600 font-medium">
                        <LinkIcon className="w-2.5 h-2.5" /> Recording
                      </a>
                    )}
                  </div>
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

      {/* ── Stop & Save Modal ────────────────────────────────────────────── */}
      <Modal
        open={showStopModal}
        onClose={() => { /* don't allow accidental close */ }}
        title="Save Timer"
        subtitle="Review your session before saving"
        size="sm"
        footer={
          <>
            <ModalBtn variant="danger" onClick={discardTimer} disabled={isPending}>Discard</ModalBtn>
            <ModalBtn onClick={saveTimer} disabled={isPending}>
              {isPending ? "Saving…" : `Save ${Math.max(0.25, Math.round((timerElapsed / 3600) * 4) / 4)}h`}
            </ModalBtn>
          </>
        }
      >
        <div className="space-y-4">
          {/* Elapsed time display */}
          <div className="bg-indigo-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-mono font-bold text-indigo-700 tracking-wider">{formatTimer(timerElapsed)}</p>
            <p className="text-xs text-indigo-500 mt-1">
              = {Math.max(0.25, Math.round((timerElapsed / 3600) * 4) / 4)}h logged
              {timerElapsed < 90 && <span className="ml-1">(minimum 0.25h applied)</span>}
            </p>
          </div>
          {/* Summary */}
          <div className="space-y-1 text-sm text-slate-700">
            <p><span className="text-slate-400 text-xs">Description</span><br />{timerForm.description || "—"}</p>
            {activeClient && <p><span className="text-slate-400 text-xs">Client</span><br />{activeClient.company_name}</p>}
            {activeProject && <p><span className="text-slate-400 text-xs">Project</span><br />{activeProject.project_name}</p>}
            <p><span className="text-slate-400 text-xs">Category</span><br />{timerForm.category}</p>
          </div>
          {/* Edit description before saving */}
          <div>
            <label className="text-xs font-medium text-slate-500">Edit description before saving</label>
            <textarea
              value={timerForm.description}
              onChange={e => setTimerForm(p => ({ ...p, description: e.target.value }))}
              rows={2}
              className="mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* ── Manual Log Modal ─────────────────────────────────────────────── */}
      <Modal
        open={addOpen || !!editLog}
        onClose={closeModals}
        title={editLog ? "Edit Time Log" : "Log Time Manually"}
        subtitle={editLog ? `${editLog.work_date} — ${editLog.hours}h` : "Record hours for a client or project"}
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
            <Field label="Description" required hint="Required — what did you work on?" className="sm:col-span-2">
              <Textarea
                name="work_description"
                placeholder="Describe what you worked on in detail..."
                value={form.work_description}
                onChange={e => f("work_description", e.target.value)}
                required
                rows={3}
              />
            </Field>

            {/* Screen recording upload */}
            <Field label="Screen Recording" hint="Optional — drag & drop a video file" className="sm:col-span-2">
              {editLog?.recording_url && !recordingFile ? (
                <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <LinkIcon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <a href={editLog.recording_url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 font-medium hover:underline truncate flex-1">
                    View existing recording
                  </a>
                  <button type="button" onClick={() => f("replace_recording", "true")} className="text-xs text-slate-500 hover:text-slate-700">Replace</button>
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
                    isDragging ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                  )}
                >
                  {recordingFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <Upload className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm text-slate-700 font-medium truncate max-w-48">{recordingFile.name}</span>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setRecordingFile(null); }}
                        className="p-1 hover:bg-slate-200 rounded-full"
                      >
                        <X className="w-3 h-3 text-slate-500" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-slate-300" />
                      <p className="text-sm text-slate-500">Drop a screen recording here, or <span className="text-indigo-600 font-medium">browse</span></p>
                      <p className="text-xs text-slate-400">MP4, MOV, WebM</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) setRecordingFile(file);
                    }}
                  />
                </div>
              )}
            </Field>

            {/* Screenshots of work done */}
            <Field label="Screenshots" hint="Optional — drag in screenshots of what was done for this entry" className="sm:col-span-2">
              <div
                onDragOver={e => { e.preventDefault(); setIsShotDragging(true); }}
                onDragLeave={() => setIsShotDragging(false)}
                onDrop={onShotDrop}
                onClick={() => shotInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
                  isShotDragging ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                )}
              >
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="w-6 h-6 text-slate-300" />
                  <p className="text-sm text-slate-500">Drop screenshots here, or <span className="text-indigo-600 font-medium">browse</span></p>
                  <p className="text-xs text-slate-400">PNG, JPG, GIF, WebP</p>
                </div>
                <input
                  ref={shotInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => addScreenshots(e.target.files)}
                />
              </div>

              {/* Existing screenshots (when editing) */}
              {editLog?.screenshot_urls && editLog.screenshot_urls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {editLog.screenshot_urls.map((url, i) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Screenshot ${i + 1}`} className="w-16 h-16 object-cover rounded-lg border border-slate-200 hover:border-indigo-300" />
                    </a>
                  ))}
                </div>
              )}

              {/* Newly added screenshots (pending upload) */}
              {screenshots.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {screenshots.map((file, i) => (
                    <div key={i} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={URL.createObjectURL(file)} alt={file.name} className="w-16 h-16 object-cover rounded-lg border border-indigo-200" />
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setScreenshots(prev => prev.filter((_, idx) => idx !== i)); }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50"
                      >
                        <X className="w-3 h-3 text-slate-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
