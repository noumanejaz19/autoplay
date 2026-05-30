"use client";

import { useState, useTransition } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal, Field, Input, Textarea, Select, ModalBtn } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Plus, Search, LayoutGrid, List, Calendar, Clock, User, CheckSquare } from "lucide-react";
import type { Task, Client, Project, Profile } from "@/lib/supabase/types";
import { createTaskAction, updateTaskAction, deleteTaskAction } from "@/app/actions/tasks";

type TaskWithRels = Task & {
  assignee: Pick<Profile, "id" | "full_name" | "profile_photo_url"> | null;
  project: Pick<Project, "id" | "project_name"> | null;
  client: Pick<Client, "id" | "company_name"> | null;
};

const COLUMNS = [
  { status: "To Do", label: "To Do", color: "text-indigo-600", bg: "bg-indigo-100" },
  { status: "In Progress", label: "In Progress", color: "text-blue-600", bg: "bg-blue-100" },
  { status: "Waiting on Client", label: "Waiting on Client", color: "text-amber-600", bg: "bg-amber-100" },
  { status: "Testing", label: "Testing", color: "text-violet-600", bg: "bg-violet-100" },
  { status: "Completed", label: "Completed", color: "text-emerald-600", bg: "bg-emerald-100" },
  { status: "Blocked", label: "Blocked", color: "text-rose-600", bg: "bg-rose-100" },
];

const PRIORITY_BORDER: Record<string, string> = {
  Critical: "border-l-rose-500", High: "border-l-amber-500",
  Medium: "border-l-indigo-400", Low: "border-l-slate-300",
};

type Props = {
  tasks: TaskWithRels[];
  clients: Pick<Client, "id" | "company_name">[];
  projects: Pick<Project, "id" | "project_name">[];
  profiles: Pick<Profile, "id" | "full_name">[];
  currentProfileId: string | null;
};

const BLANK = {
  title: "", description: "", client_id: "", project_id: "",
  assigned_to: "", priority: "Medium", status: "To Do",
  due_date: "", estimated_hours: "", tags: "",
};

export function TasksView({ tasks, clients, projects, profiles, currentProfileId }: Props) {
  const { success, error: toastError } = useToast();
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [editTask, setEditTask] = useState<TaskWithRels | null>(null);
  const [form, setForm] = useState(BLANK);
  const [isPending, startTransition] = useTransition();

  function f(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  function openEdit(t: TaskWithRels) {
    setForm({
      title: t.title, description: t.description ?? "",
      client_id: t.client_id ?? "", project_id: t.project_id ?? "",
      assigned_to: t.assigned_to ?? "", priority: t.priority,
      status: t.status, due_date: t.due_date ?? "",
      estimated_hours: String(t.estimated_hours ?? ""), tags: t.tags.join(", "),
    });
    setEditTask(t);
  }

  function closeModals() { setAddOpen(false); setEditTask(null); setForm(BLANK); }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = editTask
        ? await updateTaskAction(editTask.id, fd)
        : await createTaskAction(fd);
      if (res.error) { toastError(res.error); return; }
      success(editTask ? "Task updated." : "Task created.");
      closeModals();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteTaskAction(id);
      if (res.error) toastError(res.error);
      else { success("Task deleted."); closeModals(); }
    });
  }

  const base = myTasksOnly && currentProfileId
    ? tasks.filter(t => t.assigned_to === currentProfileId)
    : tasks;

  const filtered = base.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      t.title.toLowerCase().includes(q) ||
      (t.client?.company_name ?? "").toLowerCase().includes(q);
    const matchPriority = priorityFilter === "All" || t.priority === priorityFilter;
    return matchSearch && matchPriority;
  });

  const myCount = currentProfileId ? tasks.filter(t => t.assigned_to === currentProfileId).length : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-500 text-sm mt-1">
            {tasks.length} tasks · {tasks.filter(t => t.status === "In Progress").length} in progress · {tasks.filter(t => t.status === "Completed").length} done
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMyTasksOnly(p => !p)}
            className={cn("flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors border",
              myTasksOnly ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <User className="w-4 h-4" />
            My Tasks {myCount > 0 && <span className={cn("text-xs px-1.5 py-0.5 rounded-full ml-0.5", myTasksOnly ? "bg-white/20" : "bg-indigo-100 text-indigo-700")}>{myCount}</span>}
          </button>
          <button onClick={() => setView("kanban")} className={cn("p-2.5 rounded-xl transition-colors", view === "kanban" ? "bg-indigo-100 text-indigo-600" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50")}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setView("table")} className={cn("p-2.5 rounded-xl transition-colors", view === "table" ? "bg-indigo-100 text-indigo-600" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50")}>
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-indigo text-white text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 max-w-xs flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["All", "Critical", "High", "Medium", "Low"].map(p => (
            <button key={p} onClick={() => setPriorityFilter(p)} className={cn("text-xs px-3 py-1.5 rounded-lg font-medium transition-colors", priorityFilter === p ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{p}</button>
          ))}
        </div>
        {myTasksOnly && (
          <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg">Showing your tasks only</span>
        )}
      </div>

      {/* Kanban / Table */}
      {tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <CheckSquare className="w-12 h-12 mx-auto text-slate-200 mb-4" />
          <h3 className="text-slate-700 font-medium">No tasks yet</h3>
          <p className="text-slate-400 text-sm mt-1">Create your first task to get started.</p>
          <button onClick={() => setAddOpen(true)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-indigo text-white text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      ) : view === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map(col => {
            const colTasks = filtered.filter(t => t.status === col.status);
            return (
              <div key={col.status} className="flex-shrink-0 w-64">
                <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl mb-3", col.bg)}>
                  <span className={cn("text-xs font-semibold", col.color)}>{col.label}</span>
                  <span className={cn("text-xs font-bold ml-auto px-1.5 py-0.5 rounded-full bg-white/60", col.color)}>{colTasks.length}</span>
                </div>
                <div className="space-y-2.5">
                  {colTasks.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                      <p className="text-xs text-slate-400">No tasks</p>
                    </div>
                  ) : (
                    colTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => openEdit(task)}
                        className={cn("bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-2", PRIORITY_BORDER[task.priority])}
                      >
                        <p className="text-xs font-medium text-slate-800 leading-snug mb-2">{task.title}</p>
                        <div className="flex items-center gap-1 flex-wrap mb-2">
                          {task.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">{tag}</span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <div className="flex items-center gap-1">
                            <User className="w-2.5 h-2.5" />
                            <span className={cn("truncate max-w-16", task.assigned_to === currentProfileId ? "text-indigo-600 font-medium" : "")}>
                              {task.assignee?.full_name?.split(" ")[0] ?? "Unassigned"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {task.estimated_hours && (
                              <div className="flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{task.estimated_hours}h</span>
                              </div>
                            )}
                            {task.due_date && (
                              <div className="flex items-center gap-0.5">
                                <Calendar className="w-2.5 h-2.5" />
                                <span>{task.due_date.slice(5)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <span className="text-[9px] text-slate-400 truncate block">{task.client?.company_name ?? "No client"}</span>
                        </div>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => { setForm(p => ({ ...p, status: col.status })); setAddOpen(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add task
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_140px_100px_80px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <div>Task</div><div>Client</div><div>Status</div><div>Priority</div><div>Due</div>
          </div>
          {filtered.map(task => (
            <div
              key={task.id}
              onClick={() => openEdit(task)}
              className={cn("grid grid-cols-[1fr_120px_140px_100px_80px] gap-4 px-5 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors items-center border-l-2 cursor-pointer", PRIORITY_BORDER[task.priority])}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                <p className={cn("text-xs truncate", task.assigned_to === currentProfileId ? "text-indigo-600 font-medium" : "text-slate-400")}>
                  {task.assignee?.full_name ?? "Unassigned"}
                </p>
              </div>
              <p className="text-xs text-slate-500 truncate">{task.client?.company_name ?? "—"}</p>
              <StatusBadge status={task.status} size="sm" />
              <StatusBadge status={task.priority} size="sm" />
              <p className="text-xs text-slate-500">{task.due_date ? task.due_date.slice(5) : "—"}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={addOpen || !!editTask}
        onClose={closeModals}
        title={editTask ? "Edit Task" : "Add New Task"}
        subtitle={editTask ? `Editing: ${editTask.title}` : "Create a task and assign it"}
        size="lg"
        footer={
          <>
            <ModalBtn variant="secondary" onClick={closeModals}>Cancel</ModalBtn>
            {editTask && (
              <ModalBtn variant="danger" onClick={() => handleDelete(editTask.id)} disabled={isPending}>Delete</ModalBtn>
            )}
            <ModalBtn form="task-form" type="submit" disabled={isPending}>
              {isPending ? "Saving…" : editTask ? "Save Changes" : "Create Task"}
            </ModalBtn>
          </>
        }
      >
        <form id="task-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Task Title" required className="sm:col-span-2">
              <Input name="title" placeholder="e.g. Set up Apollo account" value={form.title} onChange={e => f("title", e.target.value)} required />
            </Field>
            <Field label="Client">
              <Select name="client_id" value={form.client_id} onChange={e => f("client_id", e.target.value)}>
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
            <Field label="Assigned To">
              <Select name="assigned_to" value={form.assigned_to} onChange={e => f("assigned_to", e.target.value)}>
                <option value="">Unassigned</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select name="status" value={form.status} onChange={e => f("status", e.target.value)}>
                {COLUMNS.map(c => <option key={c.status} value={c.status}>{c.label}</option>)}
              </Select>
            </Field>
            <Field label="Priority">
              <Select name="priority" value={form.priority} onChange={e => f("priority", e.target.value)}>
                {["Low", "Medium", "High", "Critical"].map(o => <option key={o}>{o}</option>)}
              </Select>
            </Field>
            <Field label="Due Date">
              <Input name="due_date" type="date" value={form.due_date} onChange={e => f("due_date", e.target.value)} />
            </Field>
            <Field label="Estimated Hours">
              <Input name="estimated_hours" type="number" min="0.5" step="0.5" value={form.estimated_hours} onChange={e => f("estimated_hours", e.target.value)} />
            </Field>
            <Field label="Tags" hint="Comma-separated" className="sm:col-span-2">
              <Input name="tags" placeholder="linkedin, setup, testing" value={form.tags} onChange={e => f("tags", e.target.value)} />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea name="description" placeholder="What needs to be done?" value={form.description} onChange={e => f("description", e.target.value)} />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
