"use client";

import { useState, useTransition } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { Modal, Field, Input, Textarea, Select, ModalBtn } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  Search, Plus, Filter, Clock, ArrowRight,
  LayoutGrid, List, TrendingUp, FolderOpen,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/supabase/types";
import { createClientAction, updateClientAction, archiveClientAction } from "@/app/actions/clients";

type ClientRow = Client & {
  owner: { id: string; full_name: string; profile_photo_url: string | null } | null;
};

const STATUS_FILTERS = ["All", "Upcoming", "In The Talk", "Prioritized", "Active", "Closed", "Completed", "Archived"];

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function ClientCard({ client, onEdit }: { client: ClientRow; onEdit: (c: ClientRow) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4 group relative">
      <Link href={`/clients/${client.id}`} className="absolute inset-0 rounded-2xl" aria-label={client.company_name} />
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={client.company_name} initials={initials(client.company_name)} size="md" />
          <div>
            <h3 className="font-semibold text-slate-900">{client.company_name}</h3>
            <p className="text-xs text-slate-500">{client.contact_person_name}</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={client.status} />
        <StatusBadge status={client.health_status} />
        <StatusBadge status={client.priority} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-50 rounded-xl p-2.5">
          <p className="text-slate-400">Owner</p>
          <p className="font-medium text-slate-700 truncate mt-0.5">
            {client.owner?.full_name?.split(" ")[0] ?? "—"}
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-2.5">
          <p className="text-slate-400">Channel</p>
          <p className="font-medium text-slate-700 mt-0.5">{client.preferred_channel}</p>
        </div>
      </div>

      {client.drive_folder_url && (
        <a
          href={client.drive_folder_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="relative z-10 flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <FolderOpen className="w-3.5 h-3.5" /> Drive Folder
        </a>
      )}

      <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{new Date(client.created_at).toLocaleDateString()}</span>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); onEdit(client); }}
          className="relative z-10 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

function ClientListRow({ client, onEdit }: { client: ClientRow; onEdit: (c: ClientRow) => void }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 group relative">
      <Link href={`/clients/${client.id}`} className="absolute inset-0" aria-label={client.company_name} />
      <Avatar name={client.company_name} initials={initials(client.company_name)} size="sm" />
      <div className="w-40 flex-shrink-0">
        <p className="text-sm font-medium text-slate-800 truncate">{client.company_name}</p>
        <p className="text-xs text-slate-400 truncate">{client.contact_person_name}</p>
      </div>
      <div className="w-32 flex-shrink-0 hidden md:block">
        <p className="text-xs text-slate-500 truncate">{client.industry ?? "—"}</p>
      </div>
      <div className="w-28 flex-shrink-0 hidden lg:block">
        <p className="text-xs text-slate-600 truncate">{client.owner?.full_name?.split(" ")[0] ?? "—"}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
        <StatusBadge status={client.status} />
        <StatusBadge status={client.health_status} />
      </div>
      <button
        onClick={(e) => { e.preventDefault(); onEdit(client); }}
        className="relative z-10 text-xs text-indigo-600 hover:text-indigo-700 font-medium flex-shrink-0"
      >
        Edit
      </button>
      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
    </div>
  );
}

const BLANK_FORM = {
  company_name: "", contact_person_name: "", contact_email: "",
  contact_phone: "", whatsapp: "", preferred_channel: "Email",
  timezone: "UTC", industry: "", website: "", priority: "Medium",
  status: "Upcoming", health_status: "Healthy", internal_notes: "",
  drive_folder_url: "",
};

export function ClientsView({ clients }: { clients: ClientRow[] }) {
  const { success, error: toastError } = useToast();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [editClient, setEditClient] = useState<ClientRow | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ClientRow | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [isPending, startTransition] = useTransition();

  function openEdit(c: ClientRow) {
    setForm({
      company_name: c.company_name,
      contact_person_name: c.contact_person_name,
      contact_email: c.contact_email ?? "",
      contact_phone: c.contact_phone ?? "",
      whatsapp: c.whatsapp ?? "",
      preferred_channel: c.preferred_channel,
      timezone: c.timezone ?? "UTC",
      industry: c.industry ?? "",
      website: c.website ?? "",
      priority: c.priority,
      status: c.status,
      health_status: c.health_status,
      internal_notes: c.internal_notes ?? "",
      drive_folder_url: c.drive_folder_url ?? "",
    });
    setEditClient(c);
  }

  function closeModals() {
    setAddOpen(false);
    setEditClient(null);
    setArchiveTarget(null);
    setForm(BLANK_FORM);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = editClient
        ? await updateClientAction(editClient.id, fd)
        : await createClientAction(fd);
      if (res.error) { toastError(res.error); return; }
      success(editClient ? "Client updated." : "Client added.");
      closeModals();
    });
  }

  function handleArchive() {
    if (!archiveTarget) return;
    startTransition(async () => {
      const res = await archiveClientAction(archiveTarget.id);
      if (res.error) { toastError(res.error); return; }
      success("Client archived.");
      closeModals();
    });
  }

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      c.company_name.toLowerCase().includes(q) ||
      c.contact_person_name.toLowerCase().includes(q) ||
      (c.industry ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount = clients.filter(c => c.status === "Active").length;
  const pipelineCount = clients.filter(c => ["Upcoming", "In The Talk", "Prioritized"].includes(c.status)).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 text-sm mt-1">{clients.length} clients · {activeCount} active</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-indigo text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active", count: activeCount, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pipeline", count: pipelineCount, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "At Risk", count: clients.filter(c => c.health_status === "At Risk" || c.health_status === "Blocked").length, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "Completed", count: clients.filter(c => c.status === "Completed").length, color: "text-indigo-600", bg: "bg-indigo-50" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-3`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-48 max-w-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Status:</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={cn("text-xs px-3 py-1.5 rounded-lg font-medium transition-colors",
                  statusFilter === f ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
              >{f}</button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setView("grid")} className={cn("p-2 rounded-lg", view === "grid" ? "bg-indigo-100 text-indigo-600" : "text-slate-400 hover:bg-slate-100")}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setView("list")} className={cn("p-2 rounded-lg", view === "list" ? "bg-indigo-100 text-indigo-600" : "text-slate-400 hover:bg-slate-100")}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Client grid / list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <TrendingUp className="w-12 h-12 mx-auto text-slate-200 mb-4" />
          <h3 className="text-slate-700 font-medium">No clients found</h3>
          <p className="text-slate-400 text-sm mt-1">
            {clients.length === 0 ? "Add your first client to get started." : "Try adjusting your filters."}
          </p>
          <button onClick={() => setAddOpen(true)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-indigo text-white text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Client
          </button>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => <ClientCard key={c.id} client={c} onEdit={openEdit} />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <div className="w-8" />
            <div className="w-40">Client</div>
            <div className="w-32 hidden md:block">Industry</div>
            <div className="w-28 hidden lg:block">Owner</div>
            <div className="flex-1" />
            <div>Status</div>
            <div className="w-12" />
          </div>
          {filtered.map(c => <ClientListRow key={c.id} client={c} onEdit={openEdit} />)}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={addOpen || !!editClient}
        onClose={closeModals}
        title={editClient ? "Edit Client" : "Add New Client"}
        subtitle={editClient ? `Editing ${editClient.company_name}` : "Fill in the details to onboard a new client"}
        size="lg"
        footer={
          <>
            <ModalBtn variant="secondary" onClick={closeModals}>Cancel</ModalBtn>
            {editClient && (
              <ModalBtn variant="danger" onClick={() => { setEditClient(null); setArchiveTarget(editClient); }}>
                Archive
              </ModalBtn>
            )}
            <ModalBtn form="client-form" type="submit" disabled={isPending}>
              {isPending ? "Saving…" : editClient ? "Save Changes" : "Add Client"}
            </ModalBtn>
          </>
        }
      >
        <form id="client-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company Name" required>
              <Input name="company_name" placeholder="e.g. Acme Corp" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} required />
            </Field>
            <Field label="Contact Person" required>
              <Input name="contact_person_name" placeholder="Full name" value={form.contact_person_name} onChange={e => setForm(f => ({ ...f, contact_person_name: e.target.value }))} required />
            </Field>
            <Field label="Contact Email">
              <Input name="contact_email" type="email" placeholder="email@company.com" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
            </Field>
            <Field label="Phone">
              <Input name="contact_phone" placeholder="+1 555-000-0000" value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} />
            </Field>
            <Field label="WhatsApp">
              <Input name="whatsapp" placeholder="+1 555-000-0000" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
            </Field>
            <Field label="Preferred Channel">
              <Select name="preferred_channel" value={form.preferred_channel} onChange={e => setForm(f => ({ ...f, preferred_channel: e.target.value }))}>
                {["Email", "WhatsApp", "Slack", "Telegram", "Zoom", "Phone"].map(o => <option key={o}>{o}</option>)}
              </Select>
            </Field>
            <Field label="Industry">
              <Input name="industry" placeholder="e.g. SaaS, E-commerce" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
            </Field>
            <Field label="Timezone">
              <Select name="timezone" value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}>
                {["UTC", "EST", "PST", "CST", "MST", "GMT", "PKT", "GST", "WAT"].map(o => <option key={o}>{o}</option>)}
              </Select>
            </Field>
            <Field label="Website">
              <Input name="website" placeholder="https://..." value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
            </Field>
            <Field label="Priority">
              <Select name="priority" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {["Low", "Medium", "High", "Urgent"].map(o => <option key={o}>{o}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select name="status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {["Upcoming", "In The Talk", "Prioritized", "Active", "Closed", "Completed", "Archived"].map(o => <option key={o}>{o}</option>)}
              </Select>
            </Field>
            <Field label="Health Status">
              <Select name="health_status" value={form.health_status} onChange={e => setForm(f => ({ ...f, health_status: e.target.value }))}>
                {["Healthy", "Good", "At Risk", "Blocked", "Completed"].map(o => <option key={o}>{o}</option>)}
              </Select>
            </Field>
            <Field label="Google Drive Folder URL" hint="Link to the client's Google Drive folder" className="sm:col-span-2">
              <Input name="drive_folder_url" placeholder="https://drive.google.com/..." value={form.drive_folder_url} onChange={e => setForm(f => ({ ...f, drive_folder_url: e.target.value }))} />
            </Field>
            <Field label="Internal Notes" hint="Visible to your team only" className="sm:col-span-2">
              <Textarea name="internal_notes" placeholder="Any notes about this client..." value={form.internal_notes} onChange={e => setForm(f => ({ ...f, internal_notes: e.target.value }))} />
            </Field>
          </div>
        </form>
      </Modal>

      {/* Archive Confirmation */}
      <Modal
        open={!!archiveTarget}
        onClose={closeModals}
        title="Archive Client?"
        subtitle={`${archiveTarget?.company_name} will be marked as archived.`}
        size="sm"
        footer={
          <>
            <ModalBtn variant="secondary" onClick={closeModals}>Cancel</ModalBtn>
            <ModalBtn variant="danger" onClick={handleArchive} disabled={isPending}>
              {isPending ? "Archiving…" : "Archive"}
            </ModalBtn>
          </>
        }
      >
        <p className="text-sm text-slate-600">Archived clients are hidden from active views but their data is preserved.</p>
      </Modal>
    </div>
  );
}
