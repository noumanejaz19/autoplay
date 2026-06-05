"use client";

import { useState, useRef, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ChevronRight, Clock, Users, AlertTriangle, FileText,
  Upload, X, Video, Link as LinkIcon, MessageSquare, StickyNote,
  FolderKanban, ExternalLink, FileWarning, Plus, TrendingUp, Flag, ArrowUp, ArrowDown,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionCard } from "@/components/ui/section-card";
import { Modal, Field, Input, Textarea, ModalBtn } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  uploadProjectFileAction, addProjectLoomAction, deleteProjectResourceAction,
} from "@/app/actions/project-resources";
import { updateProjectNotesAction } from "@/app/actions/projects";
import { logProgressAction } from "@/app/actions/progress";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Props {
  project: any;
  blockers: any[];
  timeLogs: any[];
  updates: any[];
  resources: any[];
  progressLog: any[];
  isAdmin: boolean;
}

const PHASE_COLORS: Record<string, string> = {
  Discovery: "bg-violet-100 text-violet-700",
  Planning: "bg-cyan-100 text-cyan-700",
  "In Progress": "bg-indigo-100 text-indigo-700",
  Active: "bg-indigo-100 text-indigo-700",
  "Client Review": "bg-orange-100 text-orange-700",
  "On Hold": "bg-amber-100 text-amber-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-slate-100 text-slate-500",
};

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ProjectDetailView({ project, blockers, timeLogs, updates, resources, progressLog, isAdmin }: Props) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [isPending, startTransition] = useTransition();

  const documents = resources.filter((r) => r.resource_type === "document");
  const needed = resources.filter((r) => r.resource_type === "needed_document");
  const looms = resources.filter((r) => r.resource_type === "loom");

  const totalHours = timeLogs.reduce((s, t) => s + Number(t.hours ?? 0), 0);
  const openBlockers = blockers.filter((b) => b.status !== "Resolved");

  // Hours per member
  const hoursByUser: Record<string, number> = {};
  timeLogs.forEach((t) => {
    const name = t.user?.full_name ?? "Unknown";
    hoursByUser[name] = (hoursByUser[name] ?? 0) + Number(t.hours ?? 0);
  });

  // ── Notes ──────────────────────────────────────────────────────────────
  const [adminNotes, setAdminNotes] = useState(project.admin_notes ?? "");
  const [employeeNotes, setEmployeeNotes] = useState(project.employee_notes ?? "");

  function saveNotes(kind: "admin" | "employee") {
    const content = kind === "admin" ? adminNotes : employeeNotes;
    startTransition(async () => {
      const res = await updateProjectNotesAction(project.id, kind, content);
      if (res?.error) { toastError(res.error); return; }
      success(`${kind === "admin" ? "Admin" : "Employee"} notes saved.`);
      router.refresh();
    });
  }

  // ── Loom modal ─────────────────────────────────────────────────────────
  const [loomOpen, setLoomOpen] = useState(false);
  const [loomForm, setLoomForm] = useState({ title: "", url: "" });

  function addLoom(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("project_id", project.id);
    fd.set("title", loomForm.title);
    fd.set("url", loomForm.url);
    startTransition(async () => {
      const res = await addProjectLoomAction(fd);
      if (res?.error) { toastError(res.error); return; }
      success("Loom video added.");
      setLoomOpen(false);
      setLoomForm({ title: "", url: "" });
      router.refresh();
    });
  }

  function removeResource(id: string) {
    startTransition(async () => {
      const res = await deleteProjectResourceAction(id, project.id);
      if (res?.error) { toastError(res.error); return; }
      success("Removed.");
      router.refresh();
    });
  }

  // ── Progress / milestones ──────────────────────────────────────────────
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressForm, setProgressForm] = useState({ percentage: String(project.progress_percentage ?? 0), note: "", is_milestone: false, milestone_title: "" });

  // Chronological (oldest→newest) percentages, to compute the delta per entry.
  const pctEntries = [...progressLog].filter((e) => e.percentage !== null && e.percentage !== undefined).reverse();

  function logProgress(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("project_id", project.id);
    fd.set("percentage", progressForm.percentage);
    fd.set("note", progressForm.note);
    fd.set("is_milestone", String(progressForm.is_milestone));
    fd.set("milestone_title", progressForm.milestone_title);
    startTransition(async () => {
      const res = await logProgressAction(fd);
      if (res?.error) { toastError(res.error); return; }
      success("Progress logged.");
      setProgressOpen(false);
      setProgressForm({ percentage: progressForm.percentage, note: "", is_milestone: false, milestone_title: "" });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/projects" className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Projects
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 font-medium">{project.project_name}</span>
      </div>

      {/* ── Information ──────────────────────────────────────────────────── */}
      <SectionCard title="Information" icon={FolderKanban}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{project.project_name}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{project.client?.company_name ?? "No client"}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", PHASE_COLORS[project.status] ?? "bg-slate-100 text-slate-600")}>
              {project.status}
            </span>
            <StatusBadge status={project.priority} />
            {project.employee_category && (
              <span className="text-xs text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">{project.employee_category}</span>
            )}
          </div>
        </div>

        {project.description && (
          <p className="text-sm text-slate-600 mt-4 leading-relaxed">{project.description}</p>
        )}

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500">Progress</span>
            <span className="font-semibold text-slate-700">{project.progress_percentage}%</span>
          </div>
          <ProgressBar value={project.progress_percentage} size="md" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {[
            { label: "Hours Logged", value: `${totalHours.toFixed(1)}h` },
            { label: "Estimated", value: project.estimated_hours ? `${project.estimated_hours}h` : "—" },
            { label: "Open Blockers", value: openBlockers.length },
            { label: "Due", value: project.expected_due_date ?? "—" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Progress & milestones ───────────────────────────────────────── */}
      <SectionCard
        title="Progress & milestones"
        icon={TrendingUp}
        subtitle="Employees log progress over time — the % change is tracked"
        action={
          <button onClick={() => setProgressOpen(true)} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Log progress
          </button>
        }
      >
        {progressLog.length === 0 ? (
          <p className="text-sm text-slate-400">No progress logged yet. Hit “Log progress” to record the current %, a milestone, or a note.</p>
        ) : (
          <div className="space-y-3">
            {progressLog.map((e) => {
              // Find this entry's position among %-bearing entries to compute the delta.
              const idx = pctEntries.findIndex((x) => x.id === e.id);
              const prevPct = idx > 0 ? pctEntries[idx - 1].percentage : null;
              const delta = e.percentage !== null && prevPct !== null ? e.percentage - prevPct : null;
              return (
                <div key={e.id} className="flex items-start gap-3 border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", e.is_milestone ? "bg-amber-50" : "bg-indigo-50")}>
                    {e.is_milestone ? <Flag className="w-4 h-4 text-amber-500" /> : <TrendingUp className="w-4 h-4 text-indigo-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {e.is_milestone && e.milestone_title && (
                        <span className="text-sm font-semibold text-slate-800">🎯 {e.milestone_title}</span>
                      )}
                      {e.percentage !== null && e.percentage !== undefined && (
                        <span className="text-sm font-semibold text-slate-700">{e.percentage}%</span>
                      )}
                      {delta !== null && delta !== 0 && (
                        <span className={cn("flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full", delta > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                          {delta > 0 ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                          {Math.abs(delta)}%
                        </span>
                      )}
                      <span className="text-xs text-slate-400 ml-auto">
                        {e.logger?.full_name ? `${e.logger.full_name} · ` : ""}{timeAgo(e.created_at)}
                      </span>
                    </div>
                    {e.note && <p className="text-sm text-slate-600 mt-0.5">{e.note}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Assigned to ───────────────────────────────────────────────── */}
        <SectionCard title="Who it's assigned to" icon={Users}>
          {project.manager?.full_name && (
            <div className="flex items-center gap-2 mb-3 text-sm">
              <span className="text-slate-400 text-xs">Lead:</span>
              <span className="font-medium text-slate-700">{project.manager.full_name}</span>
            </div>
          )}
          {(project.members ?? []).length === 0 ? (
            <p className="text-sm text-slate-400">No one assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {project.members.map((m: any) => (
                <div key={m.user_id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                    {initials(m.profile?.full_name ?? "?")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{m.profile?.full_name ?? "Unknown"}</p>
                    <p className="text-xs text-slate-400">{m.project_role}</p>
                  </div>
                  <span className="text-xs text-slate-500">{(hoursByUser[m.profile?.full_name ?? "Unknown"] ?? 0).toFixed(1)}h</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* ── Hours logged ──────────────────────────────────────────────── */}
        <SectionCard title="Hours logged" icon={Clock} subtitle={`${totalHours.toFixed(1)}h total across ${timeLogs.length} entries`}>
          {Object.keys(hoursByUser).length === 0 ? (
            <p className="text-sm text-slate-400">No time logged for this project yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(hoursByUser).sort((a, b) => b[1] - a[1]).map(([name, hrs]) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{name}</span>
                  <span className="font-semibold text-slate-800">{hrs.toFixed(1)}h</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Updates & standups ──────────────────────────────────────────── */}
      <SectionCard title="Updates & what employees stand up" icon={MessageSquare}>
        {updates.length === 0 ? (
          <p className="text-sm text-slate-400">No updates posted for this project yet.</p>
        ) : (
          <div className="space-y-3">
            {updates.map((u) => (
              <div key={u.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                  {initials(u.poster?.full_name ?? "?")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{u.poster?.full_name ?? "Unknown"}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{u.update_type}</span>
                    <span className="text-xs text-slate-400 ml-auto">{timeAgo(u.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">{u.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── Blockers ────────────────────────────────────────────────────── */}
      <SectionCard title="Blockers" icon={AlertTriangle} subtitle={openBlockers.length ? `${openBlockers.length} open` : "All clear"}>
        {blockers.length === 0 ? (
          <p className="text-sm text-emerald-600 font-medium">No blockers — all clear!</p>
        ) : (
          <div className="space-y-2">
            {blockers.map((b) => (
              <div key={b.id} className={cn("rounded-xl border p-3", b.status === "Resolved" ? "border-slate-100 opacity-60" : "border-slate-200")}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800">{b.title}</p>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <StatusBadge status={b.impact} size="sm" />
                    <StatusBadge status={b.status} size="sm" />
                  </div>
                </div>
                {b.description && <p className="text-xs text-slate-500 mt-1">{b.description}</p>}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── Documents (drag-drop) ───────────────────────────────────────── */}
      <DropZone
        title="Documents"
        subtitle="Drag files straight in — click a document to open it (PDF, Google Doc, etc.)"
        icon={FileText}
        resourceType="document"
        projectId={project.id}
        items={documents}
        onRemove={removeResource}
        onUploaded={() => router.refresh()}
        emptyHint="No documents yet. Drop files here."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Needed documents (drag-in) ────────────────────────────────── */}
        <DropZone
          title="Needed documents"
          subtitle="Files employees & admins need to drag in for this project"
          icon={FileWarning}
          resourceType="needed_document"
          projectId={project.id}
          items={needed}
          onRemove={removeResource}
          onUploaded={() => router.refresh()}
          emptyHint="No needed documents yet. Drop files here."
        />

        {/* ── Loom videos ───────────────────────────────────────────────── */}
        <SectionCard
          title="Loom videos"
          icon={Video}
          subtitle="Paste a Loom (or other) video link"
          action={
            <button onClick={() => setLoomOpen(true)} className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              <Plus className="w-3.5 h-3.5" /> Add link
            </button>
          }
        >
          {looms.length === 0 ? (
            <p className="text-sm text-slate-400">No Loom videos linked yet.</p>
          ) : (
            <div className="space-y-2">
              {looms.map((l) => (
                <div key={l.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <Video className="w-4 h-4 text-violet-500" />
                  </div>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 text-sm font-medium text-slate-700 hover:text-indigo-600 truncate">
                    {l.title || l.url}
                  </a>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-indigo-500">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={() => removeResource(l.id)} disabled={isPending} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Separate notes ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="Admin notes"
          icon={StickyNote}
          subtitle="Notes for the admin — both sides can see & add"
          action={<ModalBtn onClick={() => saveNotes("admin")} disabled={isPending} className="px-3 py-1 text-xs">{isPending ? "Saving…" : "Save"}</ModalBtn>}
        >
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={5}
            placeholder={isAdmin ? "Add your notes here…" : "Notes from the admin…"}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
          />
        </SectionCard>

        <SectionCard
          title="Employee notes"
          icon={StickyNote}
          subtitle="Notes for the employee — both sides can see & add"
          action={<ModalBtn onClick={() => saveNotes("employee")} disabled={isPending} className="px-3 py-1 text-xs">{isPending ? "Saving…" : "Save"}</ModalBtn>}
        >
          <textarea
            value={employeeNotes}
            onChange={(e) => setEmployeeNotes(e.target.value)}
            rows={5}
            placeholder="Add notes here…"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
          />
        </SectionCard>
      </div>

      {/* ── Add Loom Modal ──────────────────────────────────────────────── */}
      <Modal
        open={loomOpen}
        onClose={() => setLoomOpen(false)}
        title="Add Loom video"
        subtitle="Paste the link to the Loom video"
        size="sm"
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => setLoomOpen(false)}>Cancel</ModalBtn>
            <ModalBtn form="loom-form" type="submit" disabled={isPending}>{isPending ? "Adding…" : "Add link"}</ModalBtn>
          </>
        }
      >
        <form id="loom-form" onSubmit={addLoom} className="space-y-4">
          <Field label="Title">
            <Input placeholder="e.g. Walkthrough of the pipeline" value={loomForm.title} onChange={(e) => setLoomForm((p) => ({ ...p, title: e.target.value }))} />
          </Field>
          <Field label="Loom link" required>
            <Input placeholder="https://www.loom.com/share/..." value={loomForm.url} onChange={(e) => setLoomForm((p) => ({ ...p, url: e.target.value }))} required />
          </Field>
        </form>
      </Modal>

      {/* ── Log Progress Modal ──────────────────────────────────────────── */}
      <Modal
        open={progressOpen}
        onClose={() => setProgressOpen(false)}
        title="Log progress"
        subtitle={project.project_name}
        size="md"
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => setProgressOpen(false)}>Cancel</ModalBtn>
            <ModalBtn form="progress-form" type="submit" disabled={isPending}>{isPending ? "Saving…" : "Log it"}</ModalBtn>
          </>
        }
      >
        <form id="progress-form" onSubmit={logProgress} className="space-y-4">
          <Field label="Progress %" hint={`Current: ${project.progress_percentage}%. Leave as-is if unchanged.`}>
            <Input
              type="number" min="0" max="100" step="1"
              value={progressForm.percentage}
              onChange={(e) => setProgressForm((p) => ({ ...p, percentage: e.target.value }))}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={progressForm.is_milestone}
              onChange={(e) => setProgressForm((p) => ({ ...p, is_milestone: e.target.checked }))}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-300"
            />
            This is a milestone
          </label>
          {progressForm.is_milestone && (
            <Field label="Milestone title" required>
              <Input placeholder="e.g. Pipeline live in production" value={progressForm.milestone_title} onChange={(e) => setProgressForm((p) => ({ ...p, milestone_title: e.target.value }))} required />
            </Field>
          )}
          <Field label="Note" hint="What changed / what you got done">
            <Textarea placeholder="Optional note…" value={progressForm.note} onChange={(e) => setProgressForm((p) => ({ ...p, note: e.target.value }))} />
          </Field>
        </form>
      </Modal>
    </div>
  );
}

// ── Reusable drag-and-drop upload zone ───────────────────────────────────
function DropZone({
  title, subtitle, icon: Icon, resourceType, projectId, items, onRemove, onUploaded, emptyHint,
}: {
  title: string;
  subtitle: string;
  icon: any;
  resourceType: "document" | "needed_document";
  projectId: string;
  items: any[];
  onRemove: (id: string) => void;
  onUploaded: () => void;
  emptyHint: string;
}) {
  const { success, error: toastError } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set("project_id", projectId);
        fd.set("resource_type", resourceType);
        fd.set("file", file);
        const res = await uploadProjectFileAction(fd);
        if (res?.error) { toastError(res.error); setUploading(false); return; }
      }
      success("File(s) uploaded.");
      onUploaded();
    } finally {
      setUploading(false);
    }
  }, [projectId, resourceType, onUploaded, success, toastError]);

  return (
    <SectionCard title={title} icon={Icon} subtitle={subtitle}>
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); upload(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
          isDragging ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
        )}
      >
        <Upload className="w-6 h-6 mx-auto text-slate-300 mb-2" />
        <p className="text-sm text-slate-500">
          {uploading ? "Uploading…" : <>Drag files here, or <span className="text-indigo-600 font-medium">browse</span></>}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
      </div>

      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 text-center">{emptyHint}</p>
        ) : (
          items.map((d) => (
            <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-indigo-500" />
              </div>
              <a href={d.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 text-sm font-medium text-slate-700 hover:text-indigo-600 truncate">
                {d.title || d.file_name || "Document"}
              </a>
              <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-indigo-500">
                <LinkIcon className="w-3.5 h-3.5" />
              </a>
              <button onClick={() => onRemove(d.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}
