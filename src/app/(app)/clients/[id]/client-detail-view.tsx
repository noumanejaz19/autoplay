"use client";

import { useState, useRef, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ChevronRight, Mail, Phone, MessageSquare, Globe,
  AlertTriangle, Clock, FolderKanban, ExternalLink, Building2,
  FileText, Upload, X, Lock, Users as UsersIcon, Plus, Send, Calendar,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { RichText } from "@/components/ui/rich-text";
import { Modal, Field, Input, Textarea, Select, ModalBtn } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { Client, Project, Blocker, TimeLog } from "@/lib/supabase/types";
import { uploadClientDocumentAction, deleteClientDocumentAction } from "@/app/actions/client-documents";
import { createUpdateAction } from "@/app/actions/updates";

/* eslint-disable @typescript-eslint/no-explicit-any */
type ExtendedProject = Project & { manager?: { id: string; full_name: string } | null };
type ExtendedBlocker = Blocker & { responsible?: { id: string; full_name: string } | null };
type ExtendedTimeLog = TimeLog & { user?: { id: string; full_name: string } | null };

interface Props {
  client: Client;
  projects: ExtendedProject[];
  blockers: ExtendedBlocker[];
  timeLogs: ExtendedTimeLog[];
  documents: any[];
  updates: any[];
  isAdmin: boolean;
  currentProfileId: string | null;
}

const tabs = ["Docs", "Projects", "Updates", "Blockers", "Time Logs"] as const;
type Tab = (typeof tabs)[number];

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const HEALTH_COLOR: Record<string, string> = {
  Healthy: "bg-emerald-500", Good: "bg-emerald-400", "At Risk": "bg-amber-400",
  Blocked: "bg-rose-500", Completed: "bg-slate-400",
};
const STATUS_COLORS: Record<string, string> = {
  Active: "bg-indigo-500", Upcoming: "bg-sky-500", "In The Talk": "bg-violet-500",
  Prioritized: "bg-amber-500", Closed: "bg-slate-400", Completed: "bg-emerald-500", Archived: "bg-slate-300",
};
const UPDATE_TYPES = ["general", "progress", "blocker", "milestone", "note"] as const;
const TYPE_COLORS: Record<string, string> = {
  general: "bg-slate-100 text-slate-600", progress: "bg-indigo-100 text-indigo-700",
  blocker: "bg-rose-100 text-rose-700", milestone: "bg-emerald-100 text-emerald-700", note: "bg-amber-100 text-amber-700",
};

export function ClientDetailView({ client, projects, blockers, timeLogs, documents, updates, isAdmin, currentProfileId }: Props) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("Docs");
  const [isPending, startTransition] = useTransition();

  const initials = getInitials(client.company_name);
  const healthColor = HEALTH_COLOR[client.health_status] ?? "bg-slate-400";
  const statusColor = STATUS_COLORS[client.status] ?? "bg-slate-400";

  const totalHours = timeLogs.reduce((sum, l) => sum + l.hours, 0);
  const openBlockers = blockers.filter((b) => b.status !== "Resolved").length;

  const adminDocs = documents.filter((d) => d.visibility === "admin");
  const sharedDocs = documents.filter((d) => d.visibility === "shared");

  function removeDoc(docId: string) {
    startTransition(async () => {
      const res = await deleteClientDocumentAction(docId, client.id);
      if (res?.error) { toastError(res.error); return; }
      success("Document removed.");
      router.refresh();
    });
  }

  // ── Post update ──────────────────────────────────────────────────────────
  const [postOpen, setPostOpen] = useState(false);
  const [updForm, setUpdForm] = useState({
    content: "", update_type: "general" as typeof UPDATE_TYPES[number],
    update_date: new Date().toISOString().slice(0, 10),
  });

  function postUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("client_id", client.id);
    fd.set("content", updForm.content);
    fd.set("update_type", updForm.update_type);
    fd.set("update_date", updForm.update_date);
    startTransition(async () => {
      const res = await createUpdateAction(fd);
      if (res?.error) { toastError(res.error); return; }
      success("Update logged.");
      setPostOpen(false);
      setUpdForm({ content: "", update_type: "general", update_date: new Date().toISOString().slice(0, 10) });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/clients" className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Clients
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 font-medium">{client.company_name}</span>
      </div>

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="h-20 w-full bg-gradient-to-r from-indigo-500/10 to-violet-500/20" />
        <div className="px-6 pb-6">
          <div className="flex items-start justify-between -mt-7 mb-5">
            <div className="w-14 h-14 rounded-2xl border-4 border-white bg-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-lg">
              {initials}
            </div>
            <div className="flex items-center gap-2 mt-8">
              <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full text-white", statusColor)}>{client.status}</span>
              <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full text-white", healthColor)}>{client.health_status}</span>
              <StatusBadge status={client.priority} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{client.company_name}</h1>
                <p className="text-slate-500 text-sm">{client.contact_person_name}</p>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {client.contact_email && (
                  <a href={`mailto:${client.contact_email}`} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-600 transition-colors">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {client.contact_email}
                  </a>
                )}
                {client.contact_phone && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {client.contact_phone}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> {client.preferred_channel}
                </div>
                {client.timezone && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {client.timezone}
                  </div>
                )}
                {client.website && (
                  <a href={client.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-600 transition-colors">
                    <Globe className="w-3.5 h-3.5 text-slate-400" /> {client.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {client.industry && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> {client.industry}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Projects", value: projects.length },
                { label: "Hours Logged", value: `${totalHours.toFixed(1)}h` },
                { label: "Open Blockers", value: openBlockers },
                { label: "Documents", value: documents.length },
              ].map((s) => (
                <div key={s.label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400">{s.label}</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
              activeTab === tab ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Docs ──────────────────────────────────────────────────────────── */}
      {activeTab === "Docs" && (
        <div className="space-y-4">
          <ClientDocBucket
            title="Shared with team" icon={UsersIcon} visibility="shared"
            hint="Everyone on the team can see these documents"
            clientId={client.id} docs={sharedDocs} onRemove={removeDoc} onUploaded={() => router.refresh()}
          />
          {isAdmin && (
            <ClientDocBucket
              title="Admin only" icon={Lock} visibility="admin"
              hint="Only admins can see these documents"
              clientId={client.id} docs={adminDocs} onRemove={removeDoc} onUploaded={() => router.refresh()}
            />
          )}

          {client.drive_folder_url && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                <FolderKanban className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">Google Drive Folder</p>
                <p className="text-xs text-slate-400 truncate">{client.drive_folder_url}</p>
              </div>
              <a href={client.drive_folder_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> Open
              </a>
            </div>
          )}

          {client.internal_notes && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Internal Notes</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{client.internal_notes}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Projects ──────────────────────────────────────────────────────── */}
      {activeTab === "Projects" && (
        <div className="space-y-3">
          {projects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <FolderKanban className="w-10 h-10 mx-auto text-slate-200 mb-3" />
              <p className="text-slate-400 text-sm">No projects yet for this client.</p>
            </div>
          ) : (
            projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="block bg-white rounded-2xl border border-slate-200 p-5 hover:border-indigo-300 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{p.project_name}</h3>
                    {p.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{p.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <StatusBadge status={p.status} />
                    <StatusBadge status={p.priority} />
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </div>
                <div className="mb-3"><ProgressBar value={p.progress_percentage} showLabel /></div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  {p.project_type && <span>Type: <strong className="text-slate-700">{p.project_type}</strong></span>}
                  {p.expected_due_date && <span>Due: <strong className="text-slate-700">{p.expected_due_date}</strong></span>}
                  {p.manager && <span>Manager: <strong className="text-slate-700">{p.manager.full_name}</strong></span>}
                  <span className="text-indigo-600 font-medium ml-auto">Open project → log progress & milestones</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* ── Updates ───────────────────────────────────────────────────────── */}
      {activeTab === "Updates" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{updates.length} update{updates.length === 1 ? "" : "s"} logged</p>
            <button onClick={() => setPostOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-indigo text-white text-sm font-medium hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> Log update
            </button>
          </div>

          {updates.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-200 mb-3" />
              <p className="text-slate-400 text-sm">No updates yet. Log the first one — it&apos;s dated so you can track progress over time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {updates.map((u) => (
                <div key={u.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                      {getInitials(u.poster?.full_name ?? "?")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-slate-800">{u.poster?.full_name ?? "Unknown"}</span>
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", TYPE_COLORS[u.update_type] ?? TYPE_COLORS.general)}>{u.update_type}</span>
                        <span className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
                          <Calendar className="w-3 h-3" /> {u.update_date ?? new Date(u.created_at).toISOString().slice(0, 10)}
                        </span>
                      </div>
                      <RichText text={u.content} className="text-sm text-slate-700" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Blockers ──────────────────────────────────────────────────────── */}
      {activeTab === "Blockers" && (
        <div className="space-y-3">
          {blockers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <AlertTriangle className="w-10 h-10 mx-auto text-slate-200 mb-3" />
              <p className="text-emerald-600 font-medium text-sm">No blockers — all clear!</p>
            </div>
          ) : (
            blockers.map((b) => (
              <div key={b.id} className={cn("bg-white rounded-2xl border p-5", b.status === "Resolved" ? "border-slate-100 opacity-60" : "border-slate-200")}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">{b.title}</h3>
                  <div className="flex gap-2 flex-shrink-0 ml-3">
                    <StatusBadge status={b.status} />
                    <StatusBadge status={b.impact} />
                  </div>
                </div>
                {b.description && <p className="text-sm text-slate-600 mb-3">{b.description}</p>}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div><span className="text-slate-400">Needed from: </span><span className="font-medium text-rose-600">{b.needed_from}</span></div>
                  {b.responsible && <div><span className="text-slate-400">Owner: </span><span className="text-slate-700">{b.responsible.full_name}</span></div>}
                  <div><span className="text-slate-400">Requested: </span><span className="text-slate-700">{b.requested_date}</span></div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Time Logs ─────────────────────────────────────────────────────── */}
      {activeTab === "Time Logs" && (
        <div className="space-y-4">
          {timeLogs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Clock className="w-10 h-10 mx-auto text-slate-200 mb-3" />
              <p className="text-slate-400 text-sm">No time logged for this client yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {timeLogs.map((log, idx) => (
                <div key={log.id} className={cn("flex items-start gap-4 px-5 py-4", idx < timeLogs.length - 1 && "border-b border-slate-100")}>
                  <div className="text-center min-w-12">
                    <p className="text-lg font-bold text-slate-900">{log.hours}h</p>
                    <p className="text-[10px] text-slate-400 leading-tight">{log.billable ? "billable" : "non-bill"}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 leading-snug">{log.work_description ?? "No description"}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                      {log.user && <span>{log.user.full_name}</span>}<span>·</span><span>{log.work_date}</span><span>·</span><span className="capitalize">{log.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Log Update Modal ──────────────────────────────────────────────── */}
      <Modal
        open={postOpen}
        onClose={() => setPostOpen(false)}
        title="Log an update"
        subtitle={client.company_name}
        size="md"
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => setPostOpen(false)}>Cancel</ModalBtn>
            <ModalBtn form="client-update-form" type="submit" disabled={isPending}>
              <span className="flex items-center gap-1.5">{isPending ? "Saving…" : <><Send className="w-3.5 h-3.5" /> Log update</>}</span>
            </ModalBtn>
          </>
        }
      >
        <form id="client-update-form" onSubmit={postUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date" required>
              <Input type="date" value={updForm.update_date} onChange={(e) => setUpdForm((p) => ({ ...p, update_date: e.target.value }))} required />
            </Field>
            <Field label="Type">
              <Select value={updForm.update_type} onChange={(e) => setUpdForm((p) => ({ ...p, update_type: e.target.value as typeof UPDATE_TYPES[number] }))}>
                {UPDATE_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Update" required>
            <Textarea placeholder="What's the update?" value={updForm.content} onChange={(e) => setUpdForm((p) => ({ ...p, content: e.target.value }))} rows={4} required />
          </Field>
          {!currentProfileId && <p className="text-xs text-amber-600">Heads up: you&apos;ll be logged as the poster once signed in.</p>}
        </form>
      </Modal>
    </div>
  );
}

// ── Client document bucket with drag-and-drop ───────────────────────────────
function ClientDocBucket({
  title, icon: Icon, hint, visibility, clientId, docs, onRemove, onUploaded,
}: {
  title: string;
  icon: any;
  hint: string;
  visibility: "admin" | "shared";
  clientId: string;
  docs: any[];
  onRemove: (id: string) => void;
  onUploaded: () => void;
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
        fd.set("client_id", clientId);
        fd.set("visibility", visibility);
        fd.set("file", file);
        const res = await uploadClientDocumentAction(fd);
        if (res?.error) { toastError(res.error); setUploading(false); return; }
      }
      success("Document(s) uploaded.");
      onUploaded();
    } finally {
      setUploading(false);
    }
  }, [clientId, visibility, onUploaded, success, toastError]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center gap-2.5 mb-1">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", visibility === "admin" ? "bg-rose-50" : "bg-emerald-50")}>
          <Icon className={cn("w-4 h-4", visibility === "admin" ? "text-rose-500" : "text-emerald-500")} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-400">{hint}</p>
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); upload(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "mt-3 border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors",
          isDragging ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
        )}
      >
        <Upload className="w-5 h-5 mx-auto text-slate-300 mb-1.5" />
        <p className="text-sm text-slate-500">
          {uploading ? "Uploading…" : <>Drag documents here, or <span className="text-indigo-600 font-medium">browse</span></>}
        </p>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
      </div>

      <div className="mt-3 space-y-2">
        {docs.length === 0 ? (
          <p className="text-xs text-slate-400 text-center">No documents in this bucket yet.</p>
        ) : (
          docs.map((d) => (
            <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-indigo-500" />
              </div>
              <a href={d.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 text-sm font-medium text-slate-700 hover:text-indigo-600 truncate">
                {d.title || d.file_name || "Document"}
              </a>
              <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-indigo-500"><ExternalLink className="w-3.5 h-3.5" /></a>
              <button onClick={() => onRemove(d.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
