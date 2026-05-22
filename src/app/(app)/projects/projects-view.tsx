"use client";

import { useState, useTransition } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Avatar } from "@/components/ui/avatar";
import { Modal, Field, Input, Textarea, Select, ModalBtn } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Plus, Search, FolderKanban, Clock, Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project, Client } from "@/lib/supabase/types";
import { createProjectAction, updateProjectAction } from "@/app/actions/projects";

type ProjectWithRels = Project & {
  client: { id: string; company_name: string; contact_person_name: string } | null;
  manager: { id: string; full_name: string; profile_photo_url: string | null } | null;
  members: { user_id: string; project_role: string }[];
};

const STATUS_FILTERS = ["All", "Discovery", "In Progress", "Client Review", "On Hold", "Completed", "Cancelled"];
const ALL_STATUSES = ["Discovery", "Planning", "In Progress", "Client Review", "On Hold", "Completed", "Cancelled"];
const PHASE_COLORS: Record<string, string> = {
  Discovery: "bg-violet-100 text-violet-700",
  Planning: "bg-cyan-100 text-cyan-700",
  "In Progress": "bg-indigo-100 text-indigo-700",
  "Client Review": "bg-orange-100 text-orange-700",
  "On Hold": "bg-amber-100 text-amber-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-slate-100 text-slate-500",
};

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

const BLANK = {
  project_name: "", client_id: "", description: "", project_type: "",
  start_date: new Date().toISOString().slice(0, 10), expected_due_date: "",
  status: "Discovery", priority: "Medium", estimated_hours: "", tags: "", internal_notes: "",
};

export function ProjectsView({ projects, clients }: { projects: ProjectWithRels[]; clients: Pick<Client, "id" | "company_name">[] }) {
  const { success, error: toastError } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [editProject, setEditProject] = useState<ProjectWithRels | null>(null);
  const [form, setForm] = useState(BLANK);
  const [isPending, startTransition] = useTransition();

  function f(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  function openEdit(p: ProjectWithRels) {
    setForm({
      project_name: p.project_name,
      client_id: p.client_id ?? "",
      description: p.description ?? "",
      project_type: p.project_type ?? "",
      start_date: p.start_date ?? new Date().toISOString().slice(0, 10),
      expected_due_date: p.expected_due_date ?? "",
      status: p.status,
      priority: p.priority,
      estimated_hours: String(p.estimated_hours ?? ""),
      tags: p.tags.join(", "),
      internal_notes: p.internal_notes ?? "",
    });
    setEditProject(p);
  }

  function closeModals() { setAddOpen(false); setEditProject(null); setForm(BLANK); }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = editProject
        ? await updateProjectAction(editProject.id, fd)
        : await createProjectAction(fd);
      if (res.error) { toastError(res.error); return; }
      success(editProject ? "Project updated." : "Project created.");
      closeModals();
    });
  }

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      p.project_name.toLowerCase().includes(q) ||
      (p.client?.company_name ?? "").toLowerCase().includes(q) ||
      (p.project_type ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500 text-sm mt-1">{projects.length} projects total</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-indigo text-white text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "In Progress", count: projects.filter(p => p.status === "In Progress").length, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Discovery", count: projects.filter(p => p.status === "Discovery").length, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "On Hold", count: projects.filter(p => p.status === "On Hold").length, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Completed", count: projects.filter(p => p.status === "Completed").length, color: "text-emerald-600", bg: "bg-emerald-50" },
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
          <input type="text" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium self-center">Status:</span>
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn("text-xs px-3 py-1.5 rounded-lg font-medium transition-colors", statusFilter === s ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{s}</button>
          ))}
        </div>
      </div>

      {/* Project cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <FolderKanban className="w-12 h-12 mx-auto text-slate-200 mb-4" />
          <h3 className="text-slate-700 font-medium">No projects found</h3>
          <p className="text-slate-400 text-sm mt-1">
            {projects.length === 0 ? "Create your first project." : "Try adjusting your filters."}
          </p>
          <button onClick={() => setAddOpen(true)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-indigo text-white text-sm font-medium">
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map(project => (
            <div key={project.id} className="bg-white rounded-2xl border border-slate-200 p-5 card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  {project.client && (
                    <Avatar name={project.client.company_name} initials={initials(project.client.company_name)} size="sm" />
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-900">{project.project_name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{project.client?.company_name ?? "No client"}</p>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={cn("text-xs font-medium px-2.5 py-0.5 rounded-full", PHASE_COLORS[project.status] ?? "bg-slate-100 text-slate-600")}>
                    {project.status}
                  </span>
                  <StatusBadge status={project.priority} />
                  <button onClick={() => openEdit(project)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Edit</button>
                </div>
              </div>

              {project.description && (
                <p className="text-xs text-slate-500 mb-4 leading-relaxed line-clamp-2">{project.description}</p>
              )}

              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Progress</span>
                  <span className="font-semibold text-slate-700">{project.progress_percentage}%</span>
                </div>
                <ProgressBar value={project.progress_percentage} size="md" />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  {project.estimated_hours && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{project.estimated_hours}h est.</span>
                    </div>
                  )}
                  {project.expected_due_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Due {project.expected_due_date}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{project.members?.length ?? 0}</span>
                  </div>
                </div>
                {project.project_type && (
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{project.project_type}</span>
                )}
              </div>

              {project.tags.length > 0 && (
                <div className="flex gap-1.5 mt-3">
                  {project.tags.map(tag => (
                    <span key={tag} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={addOpen || !!editProject}
        onClose={closeModals}
        title={editProject ? "Edit Project" : "New Project"}
        subtitle={editProject ? `Editing ${editProject.project_name}` : "Create a project and link it to a client"}
        size="lg"
        footer={
          <>
            <ModalBtn variant="secondary" onClick={closeModals}>Cancel</ModalBtn>
            <ModalBtn form="project-form" type="submit" disabled={isPending}>
              {isPending ? "Saving…" : editProject ? "Save Changes" : "Create Project"}
            </ModalBtn>
          </>
        }
      >
        <form id="project-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Project Name" required>
              <Input name="project_name" placeholder="e.g. LinkedIn Outreach System" value={form.project_name} onChange={e => f("project_name", e.target.value)} required />
            </Field>
            <Field label="Project Type">
              <Input name="project_type" placeholder="e.g. Lead Generation, AI Bot" value={form.project_type} onChange={e => f("project_type", e.target.value)} />
            </Field>
            <Field label="Client">
              <Select name="client_id" value={form.client_id} onChange={e => f("client_id", e.target.value)}>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select name="status" value={form.status} onChange={e => f("status", e.target.value)}>
                {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Priority">
              <Select name="priority" value={form.priority} onChange={e => f("priority", e.target.value)}>
                {["Low", "Medium", "High", "Urgent"].map(p => <option key={p}>{p}</option>)}
              </Select>
            </Field>
            <Field label="Estimated Hours">
              <Input name="estimated_hours" type="number" min="1" step="1" value={form.estimated_hours} onChange={e => f("estimated_hours", e.target.value)} />
            </Field>
            <Field label="Start Date">
              <Input name="start_date" type="date" value={form.start_date} onChange={e => f("start_date", e.target.value)} />
            </Field>
            <Field label="Due Date">
              <Input name="expected_due_date" type="date" value={form.expected_due_date} onChange={e => f("expected_due_date", e.target.value)} />
            </Field>
            <Field label="Tags" hint="Comma-separated: ai, outreach, crm">
              <Input name="tags" placeholder="tag1, tag2" value={form.tags} onChange={e => f("tags", e.target.value)} />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea name="description" placeholder="What does this project involve?" value={form.description} onChange={e => f("description", e.target.value)} />
            </Field>
            <Field label="Internal Notes" hint="Not visible to client" className="sm:col-span-2">
              <Textarea name="internal_notes" placeholder="Notes for the team only..." value={form.internal_notes} onChange={e => f("internal_notes", e.target.value)} />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
