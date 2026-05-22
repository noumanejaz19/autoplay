"use client";

import { useState, useTransition } from "react";
import { Modal, Field, Input, Textarea, Select, ModalBtn } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  Plus, Search, HardDrive, ExternalLink, Pin, FileText, Film, Link2, Image, Filter,
} from "lucide-react";
import type { ClientAsset, Client, Project } from "@/lib/supabase/types";
import { createAssetAction, togglePinAssetAction, deleteAssetAction } from "@/app/actions/assets";

type AssetWithRels = ClientAsset & {
  client: Pick<Client, "id" | "company_name"> | null;
  project: Pick<Project, "id" | "project_name"> | null;
  uploader: { id: string; full_name: string } | null;
};

const TYPE_ICON: Record<string, React.ElementType> = {
  "Google Drive": HardDrive, "Google Sheet": FileText, "Google Doc": FileText,
  Loom: Film, PDF: FileText, Image: Image, "API Docs": FileText,
  "Brand Assets": Image, Video: Film, Document: FileText, Contract: FileText, Other: Link2,
};
const TYPE_COLOR: Record<string, string> = {
  "Google Sheet": "bg-emerald-50 text-emerald-600", "Google Doc": "bg-blue-50 text-blue-600",
  "Google Drive": "bg-yellow-50 text-yellow-600", Loom: "bg-violet-50 text-violet-600",
  PDF: "bg-rose-50 text-rose-600", Image: "bg-cyan-50 text-cyan-600",
  "API Docs": "bg-orange-50 text-orange-600", Contract: "bg-indigo-50 text-indigo-600",
  Other: "bg-slate-100 text-slate-600",
};
const ASSET_TYPES = ["Google Drive", "Google Sheet", "Google Doc", "Loom", "PDF", "Image", "API Docs", "Brand Assets", "Video", "Document", "Contract", "Other"];

type Props = {
  assets: AssetWithRels[];
  clients: Pick<Client, "id" | "company_name">[];
  projects: Pick<Project, "id" | "project_name">[];
};

const BLANK = {
  title: "", description: "", client_id: "", project_id: "",
  asset_type: "Document", external_url: "", visibility: "Internal",
  is_pinned: "false", provided_by_client: "false", tags: "",
};

export function AssetsView({ assets, clients, projects }: Props) {
  const { success, error: toastError } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [isPending, startTransition] = useTransition();

  function f(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }
  function closeModals() { setAddOpen(false); setForm(BLANK); }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createAssetAction(fd);
      if (res.error) { toastError(res.error); return; }
      success("Asset added.");
      closeModals();
    });
  }

  function handleTogglePin(id: string, pinned: boolean) {
    startTransition(async () => {
      const res = await togglePinAssetAction(id, pinned);
      if (res.error) toastError(res.error);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteAssetAction(id);
      if (res.error) toastError(res.error);
      else success("Asset deleted.");
    });
  }

  const filtered = assets.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.title.toLowerCase().includes(q) ||
      (a.client?.company_name ?? "").toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q));
    const matchType = typeFilter === "All" || a.asset_type === typeFilter;
    return matchSearch && matchType;
  });

  const pinned = filtered.filter(a => a.is_pinned);
  const unpinned = filtered.filter(a => !a.is_pinned);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Client Assets</h1>
          <p className="text-slate-500 text-sm mt-1">{assets.length} assets · {assets.filter(a => a.is_pinned).length} pinned</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-indigo text-white text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Asset
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 max-w-xs">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400" />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          {["All", ...ASSET_TYPES].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={cn("text-xs px-3 py-1.5 rounded-lg font-medium transition-colors", typeFilter === t ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{t}</button>
          ))}
        </div>
      </div>

      {/* Assets */}
      {assets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <HardDrive className="w-12 h-12 mx-auto text-slate-200 mb-4" />
          <h3 className="text-slate-700 font-medium">No assets yet</h3>
          <p className="text-slate-400 text-sm mt-1">Add links, files, and resources for your clients.</p>
          <button onClick={() => setAddOpen(true)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-indigo text-white text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Asset
          </button>
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5" /> Pinned
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {pinned.map(a => <AssetCard key={a.id} asset={a} onTogglePin={handleTogglePin} onDelete={handleDelete} isPending={isPending} />)}
              </div>
            </div>
          )}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">All Assets</h2>}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {unpinned.map(a => <AssetCard key={a.id} asset={a} onTogglePin={handleTogglePin} onDelete={handleDelete} isPending={isPending} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Modal */}
      <Modal
        open={addOpen}
        onClose={closeModals}
        title="Add Asset"
        subtitle="Link a file, doc, or resource to a client"
        size="lg"
        footer={
          <>
            <ModalBtn variant="secondary" onClick={closeModals}>Cancel</ModalBtn>
            <ModalBtn form="asset-form" type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Add Asset"}
            </ModalBtn>
          </>
        }
      >
        <form id="asset-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Title" required className="sm:col-span-2">
              <Input name="title" placeholder="e.g. Brand Style Guide" value={form.title} onChange={e => f("title", e.target.value)} required />
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
            <Field label="Asset Type">
              <Select name="asset_type" value={form.asset_type} onChange={e => f("asset_type", e.target.value)}>
                {ASSET_TYPES.map(t => <option key={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Visibility">
              <Select name="visibility" value={form.visibility} onChange={e => f("visibility", e.target.value)}>
                {["Internal", "Project Team", "Client-visible"].map(v => <option key={v}>{v}</option>)}
              </Select>
            </Field>
            <Field label="External URL" className="sm:col-span-2">
              <Input name="external_url" type="url" placeholder="https://drive.google.com/..." value={form.external_url} onChange={e => f("external_url", e.target.value)} />
            </Field>
            <Field label="Tags" hint="Comma-separated">
              <Input name="tags" placeholder="brand, design, docs" value={form.tags} onChange={e => f("tags", e.target.value)} />
            </Field>
            <Field label="Options">
              <div className="flex flex-col gap-2 pt-1">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" name="is_pinned" value="true" checked={form.is_pinned === "true"} onChange={e => f("is_pinned", e.target.checked ? "true" : "false")} className="rounded" />
                  Pin to top
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" name="provided_by_client" value="true" checked={form.provided_by_client === "true"} onChange={e => f("provided_by_client", e.target.checked ? "true" : "false")} className="rounded" />
                  Provided by client
                </label>
              </div>
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea name="description" placeholder="What is this asset?" value={form.description} onChange={e => f("description", e.target.value)} />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function AssetCard({ asset, onTogglePin, onDelete, isPending }: {
  asset: AssetWithRels;
  onTogglePin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  const Icon = TYPE_ICON[asset.asset_type] ?? Link2;
  const colorClass = TYPE_COLOR[asset.asset_type] ?? "bg-slate-100 text-slate-600";

  return (
    <div className={cn("bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3", asset.is_pinned && "ring-2 ring-indigo-500/20 border-indigo-200")}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", colorClass)}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800 leading-tight">{asset.title}</p>
            <p className="text-xs text-slate-400 mt-0.5">{asset.client?.company_name ?? "—"}</p>
          </div>
        </div>
        <button onClick={() => onTogglePin(asset.id, asset.is_pinned)} disabled={isPending} className={cn("p-1.5 rounded-lg transition-colors", asset.is_pinned ? "text-indigo-600 bg-indigo-50" : "text-slate-300 hover:text-indigo-500")}>
          <Pin className="w-3.5 h-3.5" />
        </button>
      </div>

      {asset.description && <p className="text-xs text-slate-500 line-clamp-2">{asset.description}</p>}

      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", colorClass)}>{asset.asset_type}</span>
        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{asset.visibility}</span>
        {asset.provided_by_client && <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">Client provided</span>}
      </div>

      {asset.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {asset.tags.map(t => <span key={t} className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">{t}</span>)}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        {asset.external_url ? (
          <a href={asset.external_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
            <ExternalLink className="w-3 h-3" /> Open
          </a>
        ) : <span className="text-xs text-slate-400">No URL</span>}
        <button onClick={() => onDelete(asset.id)} disabled={isPending} className="ml-auto text-xs text-rose-500 hover:text-rose-600 font-medium">Delete</button>
      </div>
    </div>
  );
}
