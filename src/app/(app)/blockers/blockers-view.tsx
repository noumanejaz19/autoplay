"use client";

import { useState, useTransition } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal, Field, Input, Textarea, Select, ModalBtn } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Plus, Search, AlertTriangle, CheckCircle2, MessageSquare } from "lucide-react";
import type { Blocker, Client, Project } from "@/lib/supabase/types";
import { createBlockerAction, resolveBlockerAction, updateBlockerAction, askClientAction } from "@/app/actions/blockers";

type BlockerWithRels = Blocker & {
  client: Pick<Client, "id" | "company_name"> | null;
  project: Pick<Project, "id" | "project_name"> | null;
  responsible: { id: string; full_name: string } | null;
};

const IMPACT_BG: Record<string, string> = {
  Critical: "border-l-rose-500", High: "border-l-amber-500",
  Medium: "border-l-indigo-400", Low: "border-l-slate-300",
};

const DEFAULT_ASK_MSG = "Hi, we wanted to check in — we're waiting on a few items to move forward on your project. Could you please review the links and access shared with you? Let us know if you have any questions!";

type Props = {
  blockers: BlockerWithRels[];
  clients: Pick<Client, "id" | "company_name">[];
  projects: Pick<Project, "id" | "project_name">[];
  isAdmin?: boolean;
};

const BLANK = {
  title: "", description: "", client_id: "", project_id: "",
  needed_from: "Client", impact: "High", status: "Open",
  requested_date: new Date().toISOString().slice(0, 10),
  follow_up_date: "", notes: "",
};

export function BlockersView({ blockers, clients, projects, isAdmin }: Props) {
  const { success, error: toastError } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Open");
  const [addOpen, setAddOpen] = useState(false);
  const [editBlocker, setEditBlocker] = useState<BlockerWithRels | null>(null);
  const [resolveTarget, setResolveTarget] = useState<BlockerWithRels | null>(null);
  const [askTarget, setAskTarget] = useState<BlockerWithRels | null>(null);
  const [askMessage, setAskMessage] = useState(DEFAULT_ASK_MSG);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [form, setForm] = useState(BLANK);
  const [isPending, startTransition] = useTransition();

  function f(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  function openEdit(b: BlockerWithRels) {
    setForm({
      title: b.title, description: b.description ?? "",
      client_id: b.client_id, project_id: b.project_id ?? "",
      needed_from: b.needed_from, impact: b.impact,
      status: b.status, requested_date: b.requested_date,
      follow_up_date: b.follow_up_date ?? "", notes: b.notes ?? "",
    });
    setEditBlocker(b);
  }

  function closeModals() {
    setAddOpen(false); setEditBlocker(null); setResolveTarget(null);
    setAskTarget(null); setAskMessage(DEFAULT_ASK_MSG);
    setResolutionNotes(""); setForm(BLANK);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = editBlocker
        ? await updateBlockerAction(editBlocker.id, fd)
        : await createBlockerAction(fd);
      if (res.error) { toastError(res.error); return; }
      success(editBlocker ? "Blocker updated." : "Blocker created.");
      closeModals();
    });
  }

  function handleResolve() {
    if (!resolveTarget) return;
    startTransition(async () => {
      const res = await resolveBlockerAction(resolveTarget.id, resolutionNotes || undefined);
      if (res.error) { toastError(res.error); return; }
      success("Blocker resolved.");
      closeModals();
    });
  }

  function handleAskClient() {
    if (!askTarget) return;
    startTransition(async () => {
      const res = await askClientAction(askTarget.id, askMessage);
      if (res.error) { toastError(res.error); return; }
      success("Marked as Asked Client.");
      closeModals();
    });
  }

  const filtered = blockers.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = !q || b.title.toLowerCase().includes(q) || (b.client?.company_name ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const open = blockers.filter(b => b.status === "Open").length;
  const critical = blockers.filter(b => b.status === "Open" && b.impact === "Critical").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blockers</h1>
          <p className="text-slate-500 text-sm mt-1">{open} open · {critical} critical</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-indigo text-white text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Blocker
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Open", count: open, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "Critical", count: critical, color: "text-rose-700", bg: "bg-rose-100" },
          { label: "Waiting on Client", count: blockers.filter(b => b.needed_from === "Client" && b.status === "Open").length, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Resolved", count: blockers.filter(b => b.status === "Resolved").length, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-3`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 max-w-xs flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search blockers..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["Open", "In Progress", "Asked Client", "Resolved", "All"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn("text-xs px-3 py-1.5 rounded-lg font-medium transition-colors", statusFilter === s ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{s}</button>
          ))}
        </div>
      </div>

      {/* Blocker cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-slate-200 mb-4" />
          <h3 className="text-slate-700 font-medium">
            {statusFilter === "Open" && blockers.length > 0 ? "No open blockers — all clear!" : "No blockers found"}
          </h3>
          <p className="text-slate-400 text-sm mt-1">{blockers.length === 0 ? "Track things that need client or team action." : "Try adjusting your filters."}</p>
          {blockers.length === 0 && (
            <button onClick={() => setAddOpen(true)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-indigo text-white text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Blocker
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => (
            <div key={b.id} className={cn("bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-4 border-l-4", IMPACT_BG[b.impact])}>
              <AlertTriangle className={cn("w-5 h-5 flex-shrink-0 mt-0.5", b.impact === "Critical" ? "text-rose-500" : b.impact === "High" ? "text-amber-500" : "text-slate-400")} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{b.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {b.client?.company_name} · Needed from {b.needed_from} · Requested {b.requested_date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={b.impact} size="sm" />
                    <StatusBadge status={b.status} size="sm" />
                  </div>
                </div>
                {b.description && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{b.description}</p>}
                {b.asked_client_message && b.status === "Asked Client" && (
                  <div className="mt-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                    <p className="text-xs text-blue-600 font-medium mb-0.5">Message sent to client:</p>
                    <p className="text-xs text-blue-700 italic">{b.asked_client_message}</p>
                  </div>
                )}
                {b.notes && <p className="text-xs text-slate-400 mt-1 italic">{b.notes}</p>}
                <div className="flex items-center gap-3 mt-3">
                  <button onClick={() => openEdit(b)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Edit</button>
                  {b.status !== "Resolved" && b.status !== "Asked Client" && isAdmin && b.needed_from === "Client" && (
                    <button
                      onClick={() => { setAskTarget(b); setAskMessage(DEFAULT_ASK_MSG); }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" /> Ask Client
                    </button>
                  )}
                  {b.status !== "Resolved" && (
                    <button onClick={() => setResolveTarget(b)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Resolve
                    </button>
                  )}
                  {b.follow_up_date && (
                    <span className="text-xs text-slate-400">Follow-up: {b.follow_up_date}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={addOpen || !!editBlocker}
        onClose={closeModals}
        title={editBlocker ? "Edit Blocker" : "Add Blocker"}
        subtitle={editBlocker ? `Editing: ${editBlocker.title}` : "Track something blocking progress"}
        size="lg"
        footer={
          <>
            <ModalBtn variant="secondary" onClick={closeModals}>Cancel</ModalBtn>
            <ModalBtn form="blocker-form" type="submit" disabled={isPending}>
              {isPending ? "Saving…" : editBlocker ? "Save Changes" : "Add Blocker"}
            </ModalBtn>
          </>
        }
      >
        <form id="blocker-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Title" required className="sm:col-span-2">
              <Input name="title" placeholder="What is blocked?" value={form.title} onChange={e => f("title", e.target.value)} required />
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
            <Field label="Needed From">
              <Select name="needed_from" value={form.needed_from} onChange={e => f("needed_from", e.target.value)}>
                {["Client", "Team", "Vendor", "Technical"].map(o => <option key={o}>{o}</option>)}
              </Select>
            </Field>
            <Field label="Impact">
              <Select name="impact" value={form.impact} onChange={e => f("impact", e.target.value)}>
                {["Low", "Medium", "High", "Critical"].map(o => <option key={o}>{o}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select name="status" value={form.status} onChange={e => f("status", e.target.value)}>
                {["Open", "In Progress", "Asked Client", "Resolved", "Escalated"].map(o => <option key={o}>{o}</option>)}
              </Select>
            </Field>
            <Field label="Requested Date">
              <Input name="requested_date" type="date" value={form.requested_date} onChange={e => f("requested_date", e.target.value)} />
            </Field>
            <Field label="Follow-up Date">
              <Input name="follow_up_date" type="date" value={form.follow_up_date} onChange={e => f("follow_up_date", e.target.value)} />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea name="description" placeholder="Describe what's blocking progress..." value={form.description} onChange={e => f("description", e.target.value)} />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea name="notes" placeholder="Internal notes..." value={form.notes} onChange={e => f("notes", e.target.value)} />
            </Field>
          </div>
        </form>
      </Modal>

      {/* Ask Client Modal */}
      <Modal
        open={!!askTarget}
        onClose={closeModals}
        title="Ask Client"
        subtitle={askTarget?.client?.company_name}
        size="sm"
        footer={
          <>
            <ModalBtn variant="secondary" onClick={closeModals}>Cancel</ModalBtn>
            <ModalBtn onClick={handleAskClient} disabled={isPending}>
              {isPending ? "Sending…" : "Mark as Asked Client"}
            </ModalBtn>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Edit the message to send to the client (for your reference — copy and send via WhatsApp/email).</p>
          <Textarea
            value={askMessage}
            onChange={e => setAskMessage(e.target.value)}
            rows={5}
          />
        </div>
      </Modal>

      {/* Resolve Modal */}
      <Modal
        open={!!resolveTarget}
        onClose={closeModals}
        title="Resolve Blocker"
        subtitle={resolveTarget?.title}
        size="sm"
        footer={
          <>
            <ModalBtn variant="secondary" onClick={closeModals}>Cancel</ModalBtn>
            <ModalBtn onClick={handleResolve} disabled={isPending}>
              {isPending ? "Resolving…" : "Mark Resolved"}
            </ModalBtn>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Add a note about how this was resolved (optional).</p>
          <Textarea
            placeholder="Resolution notes..."
            value={resolutionNotes}
            onChange={e => setResolutionNotes(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
