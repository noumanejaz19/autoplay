"use client";

import { useState, useTransition } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Avatar } from "@/components/ui/avatar";
import { Modal, Field, Input, Textarea, Select, ModalBtn } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Plus, Search, FolderKanban, Clock, Calendar, Users, AlertOctagon, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project, Client } from "@/lib/supabase/types";
import { createProjectAction, updateProjectAction } from "@/app/actions/projects";
import { upsertProjectDocumentAction, getProjectDocuments } from "@/app/actions/project-documents";

type ProjectWithRels = Project & {
  client: { id: string; company_name: string; contact_person_name: string } | null;
  manager: { id: string; full_name: string; profile_photo_url: string | null } | null;
  members: { user_id: string; project_role: string }[];
};

const STATUS_FILTERS = ["All", "Discovery", "In Progress", "Client Review", "On Hold", "Completed", "Cancelled"];
const ALL_STATUSES = ["Discovery", "Planning", "In Progress", "Client Review", "On Hold", "Completed", "Cancelled"];
const EMPLOYEE_CATEGORIES = ["", "AI Automation", "Lead Generation", "CRM Setup", "Outreach", "Infrastructure", "Content", "Design", "Research", "Other"];
const PHASE_COLORS: Record<string, string> = {
  Discovery: "bg-violet-100 text-violet-700",
  Planning: "bg-cyan-100 text-cyan-700",
  "In Progress": "bg-indigo-100 text-indigo-700",
  "Client Review": "bg-orange-100 text-orange-700",
  "On Hold": "bg-amber-100 text-amber-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-slate-100 text-slate-500",
};

const DOC_SECTIONS = [
  { key: "setup_requirements" as const, label: "Setup Requirements", hint: "What needs to be set up (tools, accounts, access)" },
  { key: "what_is_needed" as const, label: "What Is Needed", hint: "What we need from the client to proceed" },
  { key: "plans" as const, label: "Plans", hint: "Project plan, timeline, strategy docs" },
  { key: "overdeliver" as const, label: "How to Overdeliver", hint: "Ideas to exceed client expectations" },
];

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function isOverdue(project: ProjectWithRels) {
  if (!project.expected_due_date) return false;
  if (["Completed", "Cancelled"].includes(project.status)) return false;
  return new Date(project.expected_due_date) < new Date();
}

const BLANK = {
  project_name: "", client_id: "", description: "", project_type: "",
  start_date: new Date().toISOString().slice(0, 10), expected_due_date: "",
  status: "Discovery", priority: "Medium", estimated_hours: "", tags: "",
  internal_notes: "", overdue_reason: "", employee_category: "",
};

export function ProjectsView({ projects, clients }: { projects: ProjectWithRels[]; clients: Pick<Client, "id" | "company_name">[] }) {
  const { success, error: toastError } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [editProject, setEditProject] = useState<ProjectWithRels | null>(null);
  const [docsProject, setDocsProject] = useState<ProjectWithRels | null>(null);
  const [docsForm, setDocsForm] = useState<Record<string, { link_url: string; link_title: string; notes: string }>>({});
  const [activeDocTab, setActiveDocTab] = useState<typeof DOC_SECTIONS[0]["key"]>("setup_requirements");
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
      overdue_reason: p.overdue_reason ?? "",
      employee_category: p.employee_category ?? "",
    });
    setEditProject(p);
  }

  async function openDocs(p: ProjectWithRels) {
    setDocsProject(p);
    try {
      type DocRow = { section_type: string; link_url: string | null; link_title: string | null; notes: string | null };
      const data = (await getProjectDocuments(p.id)) as DocRow[];
      const initial: Record<string, { link_url: string; link_title: string; notes: string }> = {};
      DOC_SECTIONS.forEach(s => {
        const existing = data.find(d => d.section_type === s.key);
        initial[s.key] = {
          link_url: existing?.link_url ?? "",
          link_title: existing?.link_title ?? "",
          notes: existing?.notes ?? "",
        };
      });
      setDocsForm(initial);
    } catch {
      setDocsForm({});
    }
  }

  function closeModals() {
    setAddOpen(false); setEditProject(null); setDocsProject(null);
    setDocsForm({}); setForm(BLANK);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // If overdue and no reason given, require it
    if (editProject && isOverdue(editProject) && !fd.get("overdue_reason")) {
      toastError("Please provide a reason why this project is overdue.");
      return;
    }
    startTransition(async () => {
      const res = editProject
        ? await updateProjectAction(editProject.id, fd)
        : await createProjectAction(fd);
      if (res.error) { toastError(res.error); return; }
      success(editProject ? "Project updated." : "Project created.");
      closeModals();
    });
  }

  function handleDocSave() {
    if (!docsProject) return;
    const section = docsForm[activeDocTab];
    const fd = new FormData();
    fd.set("project_id", docsProject.id);
    fd.set("section_type", activeDocTab);
    fd.set("link_url", section?.link_url ?? "");
    fd.set("link_title", section?.link_title ?? "");
    fd.set("notes", section?.notes ?? "");
    startTransition(async () => {
      const res = await upsertProjectDocumentAction(fd);
      if (res.error) { toastError(res.error); return; }
      success("Document saved.");
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
          { label: "Overdue", count: projects.filter(isOverdue).length, color: "text-rose-600", bg: "bg-rose-50" },
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
          {filtered.map(project => {
            const overdue = isOverdue(project);
            return (
              <div key={project.id} className={cn("bg-white rounded-2xl border p-5 card-hover", overdue ? "border-rose-200" : "border-slate-200")}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    {project.client && (
                      <Avatar name={project.client.company_name} initials={initials(project.client.company_name)} size="sm" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{project.project_name}</h3>
                        {overdue && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
                            <AlertOctagon className="w-2.5 h-2.5" /> Overdue
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{project.client?.company_name ?? "No client"}</p>
                      {project.employee_category && (
                        <span className="text-[10px] text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full mt-1 inline-block">{project.employee_category}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className={cn("text-xs font-medium px-2.5 py-0.5 rounded-full", PHASE_COLORS[project.status] ?? "bg-slate-100 text-slate-600")}>
                      {project.status}
                    </span>
                    <StatusBadge status={project.priority} />
                  </div>
                </div>

                {overdue && project.overdue_reason && (
                  <div className="mb-3 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                    <p className="text-xs text-rose-600 font-medium">Overdue reason:</p>
                    <p className="text-xs text-rose-700 mt-0.5">{project.overdue_reason}</p>
                  </div>
                )}

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
                      <div className={cn("flex items-center gap-1", overdue ? "text-rose-500 font-medium" : "")}>
                        <Calendar className="w-3 h-3" />
                        <span>Due {project.expected_due_date}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{project.members?.length ?? 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openDocs(project)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 font-medium transition-colors">
                      <FileText className="w-3 h-3" /> Docs
                    </button>
                    <button onClick={() => openEdit(project)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Edit</button>
                  </div>
                </div>

                {project.tags.length > 0 && (
                  <div className="flex gap-1.5 mt-3">
                    {project.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
            <Field label="Category">
              <Select name="employee_category" value={form.employee_category} onChange={e => f("employee_category", e.target.value)}>
                {EMPLOYEE_CATEGORIES.map(c => <option key={c} value={c}>{c || "— None —"}</option>)}
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
            {editProject && isOverdue(editProject) && (
              <Field label="Overdue Reason" required className="sm:col-span-2" hint="Required — explain why this project is past its due date">
                <Textarea name="overdue_reason" placeholder="e.g. Waiting on client access, scope expanded..." value={form.overdue_reason} onChange={e => f("overdue_reason", e.target.value)} required />
              </Field>
            )}
            <Field label="Description" className="sm:col-span-2">
              <Textarea name="description" placeholder="What does this project involve?" value={form.description} onChange={e => f("description", e.target.value)} />
            </Field>
            <Field label="Internal Notes" hint="Not visible to client" className="sm:col-span-2">
              <Textarea name="internal_notes" placeholder="Notes for the team only..." value={form.internal_notes} onChange={e => f("internal_notes", e.target.value)} />
            </Field>
          </div>
        </form>
      </Modal>

      {/* Documents Modal */}
      <Modal
        open={!!docsProject}
        onClose={closeModals}
        title="Project Documents"
        subtitle={docsProject?.project_name}
        size="lg"
        footer={
          <>
            <ModalBtn variant="secondary" onClick={closeModals}>Close</ModalBtn>
            <ModalBtn onClick={handleDocSave} disabled={isPending}>
              {isPending ? "Saving…" : "Save Section"}
            </ModalBtn>
          </>
        }
      >
        <div className="space-y-4">
          {/* Tab bar */}
          <div className="flex gap-1 border-b border-slate-200 pb-0">
            {DOC_SECTIONS.map(s => (
              <button
                key={s.key}
                onClick={() => setActiveDocTab(s.key)}
                className={cn(
                  "text-xs font-medium px-3 py-2 rounded-t-lg border-b-2 transition-colors",
                  activeDocTab === s.key
                    ? "border-indigo-600 text-indigo-600 bg-indigo-50"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Active section */}
          {DOC_SECTIONS.filter(s => s.key === activeDocTab).map(s => {
            const val = docsForm[s.key] ?? { link_url: "", link_title: "", notes: "" };
            return (
              <div key={s.key} className="space-y-3">
                <p className="text-xs text-slate-500">{s.hint}</p>
                <Field label="Link Title">
                  <Input
                    placeholder="e.g. Project Plan Doc"
                    value={val.link_title}
                    onChange={e => setDocsForm(p => ({ ...p, [s.key]: { ...val, link_title: e.target.value } }))}
                  />
                </Field>
                <Field label="Link URL">
                  <Input
                    placeholder="https://docs.google.com/..."
                    value={val.link_url}
                    onChange={e => setDocsForm(p => ({ ...p, [s.key]: { ...val, link_url: e.target.value } }))}
                  />
                </Field>
                <Field label="Notes">
                  <Textarea
                    placeholder="Add notes for this section..."
                    value={val.notes}
                    onChange={e => setDocsForm(p => ({ ...p, [s.key]: { ...val, notes: e.target.value } }))}
                    rows={4}
                  />
                </Field>
                {val.link_url && (
                  <a href={val.link_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                    <FileText className="w-3.5 h-3.5" /> Open {val.link_title || "Link"}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
