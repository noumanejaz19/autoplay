"use client";

import { useState, useTransition } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal, Field, Input, Textarea, Select, ModalBtn } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Plus, Search, PackageCheck, ExternalLink, CheckCircle2 } from "lucide-react";
import type { Deliverable, Client, Project } from "@/lib/supabase/types";
import { createDeliverableAction, updateDeliverableStatusAction } from "@/app/actions/deliverables";

type DeliverableWithRels = Deliverable & {
  client: Pick<Client, "id" | "company_name"> | null;
  project: Pick<Project, "id" | "project_name"> | null;
  creator: { id: string; full_name: string } | null;
};

const STATUS_ORDER = ["Draft", "Ready", "Sent", "Approved", "Needs Revision"];
const DELIVERABLE_TYPES = ["Report", "Creative", "Video", "Copy", "Strategy Doc", "Loom", "Presentation", "Code", "Other"];
const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-600", Ready: "bg-blue-50 text-blue-700",
  Sent: "bg-amber-50 text-amber-700", Approved: "bg-emerald-50 text-emerald-700",
  "Needs Revision": "bg-rose-50 text-rose-700",
};

type Props = {
  deliverables: DeliverableWithRels[];
  clients: Pick<Client, "id" | "company_name">[];
  projects: Pick<Project, "id" | "project_name">[];
};

const BLANK = {
  title: "", description: "", client_id: "", project_id: "",
  deliverable_type: "Other", status: "Draft", external_url: "",
  notes: "", client_visible: "true",
};

export function DeliverablesView({ deliverables, clients, projects }: Props) {
  const { success, error: toastError } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [isPending, startTransition] = useTransition();

  function f(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }
  function closeModals() { setAddOpen(false); setForm(BLANK); }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createDeliverableAction(fd);
      if (res.error) { toastError(res.error); return; }
      success("Deliverable created.");
      closeModals();
    });
  }

  function handleStatusChange(id: string, status: string) {
    startTransition(async () => {
      const res = await updateDeliverableStatusAction(id, status);
      if (res.error) toastError(res.error);
      else success(`Status updated to ${status}.`);
    });
  }

  const filtered = deliverables.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !q || d.title.toLowerCase().includes(q) || (d.client?.company_name ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const approved = deliverables.filter(d => d.status === "Approved").length;
  const pending = deliverables.filter(d => d.status === "Sent" || d.status === "Ready").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deliverables</h1>
          <p className="text-slate-500 text-sm mt-1">{deliverables.length} total · {approved} approved · {pending} pending review</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-indigo text-white text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Deliverable
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STATUS_ORDER.map(s => {
          const count = deliverables.filter(d => d.status === s).length;
          return (
            <div key={s} className={cn("rounded-2xl px-4 py-3 cursor-pointer", STATUS_COLORS[s])} onClick={() => setStatusFilter(statusFilter === s ? "All" : s)}>
              <p className="text-xl font-bold">{count}</p>
              <p className="text-xs opacity-80">{s}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 max-w-xs flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search deliverables..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["All", ...STATUS_ORDER].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn("text-xs px-3 py-1.5 rounded-lg font-medium transition-colors", statusFilter === s ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{s}</button>
          ))}
        </div>
      </div>

      {/* Deliverables list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <PackageCheck className="w-12 h-12 mx-auto text-slate-200 mb-4" />
            <h3 className="text-slate-700 font-medium">No deliverables found</h3>
            <p className="text-slate-400 text-sm mt-1">{deliverables.length === 0 ? "Track work delivered to clients." : "Try adjusting your filters."}</p>
            <button onClick={() => setAddOpen(true)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-indigo text-white text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Deliverable
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_120px_140px_120px_80px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <div>Deliverable</div><div>Client</div><div>Status</div><div>Type</div><div>Link</div>
            </div>
            {filtered.map(d => (
              <div key={d.id} className="grid grid-cols-[1fr_120px_140px_120px_80px] gap-4 px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors items-center">
                <div>
                  <p className="text-sm font-medium text-slate-800">{d.title}</p>
                  {d.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{d.description}</p>}
                  <p className="text-xs text-slate-400 mt-0.5">{d.creator?.full_name ?? "—"}</p>
                </div>
                <p className="text-xs text-slate-500 truncate">{d.client?.company_name ?? "—"}</p>
                <div>
                  <Select value={d.status} onChange={e => handleStatusChange(d.id, e.target.value)} className="text-xs py-1">
                    {STATUS_ORDER.map(s => <option key={s}>{s}</option>)}
                  </Select>
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full inline-block">{d.deliverable_type}</span>
                <div>
                  {d.external_url ? (
                    <a href={d.external_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700">
                      <ExternalLink className="w-3 h-3" /> Open
                    </a>
                  ) : <span className="text-xs text-slate-300">—</span>}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        open={addOpen}
        onClose={closeModals}
        title="Add Deliverable"
        subtitle="Track a piece of work delivered to a client"
        size="lg"
        footer={
          <>
            <ModalBtn variant="secondary" onClick={closeModals}>Cancel</ModalBtn>
            <ModalBtn form="deliverable-form" type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Add Deliverable"}
            </ModalBtn>
          </>
        }
      >
        <form id="deliverable-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Title" required className="sm:col-span-2">
              <Input name="title" placeholder="e.g. Campaign Report — May 2025" value={form.title} onChange={e => f("title", e.target.value)} required />
            </Field>
            <Field label="Client" required>
              <Select name="client_id" value={form.client_id} onChange={e => f("client_id", e.target.value)} required>
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
            <Field label="Type">
              <Select name="deliverable_type" value={form.deliverable_type} onChange={e => f("deliverable_type", e.target.value)}>
                {DELIVERABLE_TYPES.map(t => <option key={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select name="status" value={form.status} onChange={e => f("status", e.target.value)}>
                {STATUS_ORDER.map(s => <option key={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="External Link" className="sm:col-span-2">
              <Input name="external_url" type="url" placeholder="https://..." value={form.external_url} onChange={e => f("external_url", e.target.value)} />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea name="notes" placeholder="Internal notes about this deliverable..." value={form.notes} onChange={e => f("notes", e.target.value)} />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
