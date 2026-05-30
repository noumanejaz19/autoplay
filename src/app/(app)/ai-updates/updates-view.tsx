"use client";

import { useState, useTransition } from "react";
import { Modal, Field, Select, Textarea, ModalBtn } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import type { Client, ClientUpdate } from "@/lib/supabase/types";
import { createUpdateAction, deleteUpdateAction } from "@/app/actions/updates";

type UpdateWithPoster = ClientUpdate & {
  poster: { id: string; full_name: string; profile_photo_url: string | null } | null;
};

type Props = {
  clients: Pick<Client, "id" | "company_name">[];
  updates: UpdateWithPoster[];
  currentProfileId: string | null;
  currentProfileName: string;
};

const TYPE_COLORS: Record<string, string> = {
  general: "bg-slate-100 text-slate-600",
  progress: "bg-indigo-100 text-indigo-700",
  blocker: "bg-rose-100 text-rose-700",
  milestone: "bg-emerald-100 text-emerald-700",
  note: "bg-amber-100 text-amber-700",
};

const UPDATE_TYPES = ["general", "progress", "blocker", "milestone", "note"] as const;

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function UpdatesView({ clients, updates, currentProfileId, currentProfileName }: Props) {
  const { success, error: toastError } = useToast();
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ client_id: "", content: "", update_type: "general" as typeof UPDATE_TYPES[number] });
  const [isPending, startTransition] = useTransition();

  function closeModal() { setAddOpen(false); setForm({ client_id: "", content: "", update_type: "general" }); }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createUpdateAction(fd);
      if (res.error) { toastError(res.error); return; }
      success("Update posted.");
      closeModal();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteUpdateAction(id);
      if (res.error) toastError(res.error);
      else success("Update deleted.");
    });
  }

  const filtered = clientFilter === "all"
    ? updates
    : updates.filter(u => u.client_id === clientFilter);

  const selectedClient = clients.find(c => c.id === clientFilter);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Client Updates</h1>
          <p className="text-slate-500 text-sm mt-1">Post progress updates, notes, and milestones per client</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-indigo text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Post Update
        </button>
      </div>

      {/* Client tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setClientFilter("all")}
            className={cn("text-xs px-3 py-1.5 rounded-lg font-medium transition-colors",
              clientFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
          >
            All Clients
          </button>
          {clients.map(c => (
            <button
              key={c.id}
              onClick={() => setClientFilter(c.id)}
              className={cn("text-xs px-3 py-1.5 rounded-lg font-medium transition-colors",
                clientFilter === c.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
            >
              {c.company_name}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-3">
        {selectedClient && (
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-semibold text-slate-700">{selectedClient.company_name}</h2>
            <span className="text-xs text-slate-400">· {filtered.length} updates</span>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-slate-200 mb-4" />
            <h3 className="text-slate-700 font-medium">No updates yet</h3>
            <p className="text-slate-400 text-sm mt-1">Post the first update for this client.</p>
            <button onClick={() => setAddOpen(true)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-indigo text-white text-sm font-medium">
              <Plus className="w-4 h-4" /> Post Update
            </button>
          </div>
        ) : (
          filtered.map(update => {
            const client = clients.find(c => c.id === update.client_id);
            const isOwn = update.posted_by === currentProfileId;
            return (
              <div key={update.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                      {initials(update.poster?.full_name ?? "?")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-slate-800">{update.poster?.full_name ?? "Unknown"}</span>
                        {clientFilter === "all" && client && (
                          <span className="text-xs text-slate-400">→ {client.company_name}</span>
                        )}
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", TYPE_COLORS[update.update_type] ?? TYPE_COLORS.general)}>
                          {update.update_type}
                        </span>
                        <span className="text-xs text-slate-400 ml-auto">{timeAgo(update.created_at)}</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{update.content}</p>
                    </div>
                  </div>
                  {isOwn && (
                    <button
                      onClick={() => handleDelete(update.id)}
                      disabled={isPending}
                      className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Post Update Modal */}
      <Modal
        open={addOpen}
        onClose={closeModal}
        title="Post Update"
        subtitle="Share progress with the team"
        size="md"
        footer={
          <>
            <ModalBtn variant="secondary" onClick={closeModal}>Cancel</ModalBtn>
            <ModalBtn form="update-form" type="submit" disabled={isPending}>
              {isPending ? "Posting…" : "Post Update"}
            </ModalBtn>
          </>
        }
      >
        <form id="update-form" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Field label="Client" required>
              <Select name="client_id" value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))} required>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </Select>
            </Field>
            <Field label="Type">
              <Select name="update_type" value={form.update_type} onChange={e => setForm(p => ({ ...p, update_type: e.target.value as typeof UPDATE_TYPES[number] }))}>
                {UPDATE_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </Select>
            </Field>
            <Field label="Message" required>
              <Textarea
                name="content"
                placeholder={`What's the update on this client? (posting as ${currentProfileName || "you"})`}
                value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                required
                rows={4}
              />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
