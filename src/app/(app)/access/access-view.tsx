"use client";

import { useState, useTransition } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal, Field, Input, Textarea, Select, ModalBtn } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Plus, Search, Shield, CheckCircle2, AlertCircle, Clock, Filter } from "lucide-react";
import type { AccessItem, Client, Project } from "@/lib/supabase/types";
import { createAccessItemAction, updateAccessStatusAction, updateAccessItemAction } from "@/app/actions/access";

type AccessWithRels = AccessItem & {
  client: Pick<Client, "id" | "company_name"> | null;
  project: Pick<Project, "id" | "project_name"> | null;
  responsible: { id: string; full_name: string } | null;
};

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  "Not Started": "bg-slate-50 text-slate-600 border-slate-200",
  Revoked: "bg-rose-50 text-rose-700 border-rose-200",
  Tested: "bg-blue-50 text-blue-700 border-blue-200",
};

const CATEGORIES = ["CRM", "Social Media", "Ads", "Email", "Analytics", "Hosting", "Domain", "Payment", "Other"];
const STATUSES = ["Not Started", "Pending", "Active", "Tested", "Revoked"];

type Props = {
  items: AccessWithRels[];
  clients: Pick<Client, "id" | "company_name">[];
  projects: Pick<Project, "id" | "project_name">[];
};

const BLANK = {
  service_name: "", category: "Other", client_id: "", project_id: "",
  access_status: "Pending", priority: "Medium", secure_location_ref: "",
  login_email: "", access_notes: "", action_required: "",
};

export function AccessView({ items, clients, projects }: Props) {
  const { success, error: toastError } = useToast();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<AccessWithRels | null>(null);
  const [form, setForm] = useState(BLANK);
  const [isPending, startTransition] = useTransition();

  function f(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  function openEdit(item: AccessWithRels) {
    setForm({
      service_name: item.service_name, category: item.category,
      client_id: item.client_id, project_id: item.project_id ?? "",
      access_status: item.access_status, priority: item.priority,
      secure_location_ref: item.secure_location_ref ?? "",
      login_email: item.login_email ?? "",
      access_notes: item.access_notes ?? "", action_required: item.action_required ?? "",
    });
    setEditItem(item);
  }

  function closeModals() { setAddOpen(false); setEditItem(null); setForm(BLANK); }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = editItem
        ? await updateAccessItemAction(editItem.id, fd)
        : await createAccessItemAction(fd);
      if (res.error) { toastError(res.error); return; }
      success(editItem ? "Access item updated." : "Access item added.");
      closeModals();
    });
  }

  function handleStatusChange(id: string, status: string) {
    startTransition(async () => {
      const res = await updateAccessStatusAction(id, status);
      if (res.error) toastError(res.error);
      else success(`Status updated to ${status}.`);
    });
  }

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = !q || i.service_name.toLowerCase().includes(q) || (i.client?.company_name ?? "").toLowerCase().includes(q);
    const matchCat = catFilter === "All" || i.category === catFilter;
    const matchStatus = statusFilter === "All" || i.access_status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const pending = items.filter(i => i.access_status === "Pending").length;
  const active = items.filter(i => i.access_status === "Active").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Access Management</h1>
          <p className="text-slate-500 text-sm mt-1">{items.length} items · {active} active · {pending} pending</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-indigo text-white text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Access Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active", count: active, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending", count: pending, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Not Started", count: items.filter(i => i.access_status === "Not Started").length, color: "text-slate-600", bg: "bg-slate-50" },
          { label: "Revoked", count: items.filter(i => i.access_status === "Revoked").length, color: "text-rose-600", bg: "bg-rose-50" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-3`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 max-w-xs">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400" />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-slate-500 font-medium">Category:</span>
          {["All", ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCatFilter(c)} className={cn("text-xs px-2.5 py-1 rounded-lg font-medium transition-colors", catFilter === c ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{c}</button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          {["All", ...STATUSES].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn("text-xs px-2.5 py-1 rounded-lg font-medium transition-colors", statusFilter === s ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Shield className="w-12 h-12 mx-auto text-slate-200 mb-4" />
            <h3 className="text-slate-700 font-medium">No access items</h3>
            <p className="text-slate-400 text-sm mt-1">{items.length === 0 ? "Add client credentials and access info here." : "Try adjusting your filters."}</p>
            <button onClick={() => setAddOpen(true)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-indigo text-white text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Access Item
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_120px_140px_120px_100px_80px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <div>Service</div><div>Client</div><div>Status</div><div>Category</div><div>Priority</div><div />
            </div>
            {filtered.map(item => (
              <div key={item.id} className="grid grid-cols-[1fr_120px_140px_120px_100px_80px] gap-4 px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors items-center">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.service_name}</p>
                  {item.login_email && <p className="text-xs text-slate-400 mt-0.5">{item.login_email}</p>}
                  {item.action_required && (
                    <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {item.action_required}
                    </p>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{item.client?.company_name ?? "—"}</p>
                <div>
                  <Select
                    value={item.access_status}
                    onChange={e => handleStatusChange(item.id, e.target.value)}
                    className="text-xs py-1"
                  >
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </Select>
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full inline-block">{item.category}</span>
                <StatusBadge status={item.priority} size="sm" />
                <button onClick={() => openEdit(item)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Edit</button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={addOpen || !!editItem}
        onClose={closeModals}
        title={editItem ? "Edit Access Item" : "Add Access Item"}
        subtitle={editItem ? `Editing ${editItem.service_name}` : "Track a client credential or platform access"}
        size="lg"
        footer={
          <>
            <ModalBtn variant="secondary" onClick={closeModals}>Cancel</ModalBtn>
            <ModalBtn form="access-form" type="submit" disabled={isPending}>
              {isPending ? "Saving…" : editItem ? "Save Changes" : "Add Item"}
            </ModalBtn>
          </>
        }
      >
        <form id="access-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Service Name" required>
              <Input name="service_name" placeholder="e.g. Google Ads, Apollo.io" value={form.service_name} onChange={e => f("service_name", e.target.value)} required />
            </Field>
            <Field label="Category">
              <Select name="category" value={form.category} onChange={e => f("category", e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </Select>
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
            <Field label="Status">
              <Select name="access_status" value={form.access_status} onChange={e => f("access_status", e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Priority">
              <Select name="priority" value={form.priority} onChange={e => f("priority", e.target.value)}>
                {["Low", "Medium", "High", "Critical"].map(p => <option key={p}>{p}</option>)}
              </Select>
            </Field>
            <Field label="Login Email">
              <Input name="login_email" type="email" placeholder="client@example.com" value={form.login_email} onChange={e => f("login_email", e.target.value)} />
            </Field>
            <Field label="Credentials Location" hint="e.g. '1Password: Client Vault'">
              <Input name="secure_location_ref" placeholder="Where are creds stored?" value={form.secure_location_ref} onChange={e => f("secure_location_ref", e.target.value)} />
            </Field>
            <Field label="Action Required" className="sm:col-span-2">
              <Input name="action_required" placeholder="e.g. Request admin access" value={form.action_required} onChange={e => f("action_required", e.target.value)} />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea name="access_notes" placeholder="Additional notes..." value={form.access_notes} onChange={e => f("access_notes", e.target.value)} />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
