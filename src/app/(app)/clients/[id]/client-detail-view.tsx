"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ChevronRight, Mail, Phone, MessageSquare, Globe,
  AlertTriangle, Clock, FolderKanban, ExternalLink, Building2,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";
import type { Client, Project, Blocker, TimeLog } from "@/lib/supabase/types";

type ExtendedProject = Project & {
  manager?: { id: string; full_name: string } | null;
};

type ExtendedBlocker = Blocker & {
  responsible?: { id: string; full_name: string } | null;
};

type ExtendedTimeLog = TimeLog & {
  user?: { id: string; full_name: string } | null;
};

interface Props {
  client: Client;
  projects: ExtendedProject[];
  blockers: ExtendedBlocker[];
  timeLogs: ExtendedTimeLog[];
}

const tabs = ["Overview", "Projects", "Blockers", "Time Logs"] as const;
type Tab = (typeof tabs)[number];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const HEALTH_COLOR: Record<string, string> = {
  Healthy: "bg-emerald-500",
  Good: "bg-emerald-400",
  "At Risk": "bg-amber-400",
  Blocked: "bg-rose-500",
  Completed: "bg-slate-400",
};

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-indigo-500",
  Upcoming: "bg-sky-500",
  "In The Talk": "bg-violet-500",
  Prioritized: "bg-amber-500",
  Closed: "bg-slate-400",
  Completed: "bg-emerald-500",
  Archived: "bg-slate-300",
};

export function ClientDetailView({ client, projects, blockers, timeLogs }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  const initials = getInitials(client.company_name);
  const healthColor = HEALTH_COLOR[client.health_status] ?? "bg-slate-400";
  const statusColor = STATUS_COLORS[client.status] ?? "bg-slate-400";

  const totalHours = timeLogs.reduce((sum, l) => sum + l.hours, 0);
  const openBlockers = blockers.filter((b) => b.status !== "Resolved").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/clients" className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Clients
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
              <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full text-white", statusColor)}>
                {client.status}
              </span>
              <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full text-white", healthColor)}>
                {client.health_status}
              </span>
              <StatusBadge status={client.priority} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Info */}
            <div className="lg:col-span-2 space-y-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{client.company_name}</h1>
                <p className="text-slate-500 text-sm">{client.contact_person_name}</p>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {client.contact_email && (
                  <a href={`mailto:${client.contact_email}`} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-600 transition-colors">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {client.contact_email}
                  </a>
                )}
                {client.contact_phone && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {client.contact_phone}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  {client.preferred_channel}
                </div>
                {client.timezone && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {client.timezone}
                  </div>
                )}
                {client.website && (
                  <a href={client.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-600 transition-colors">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    {client.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {client.industry && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {client.industry}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Projects", value: projects.length },
                { label: "Hours Logged", value: `${totalHours.toFixed(1)}h` },
                { label: "Open Blockers", value: openBlockers },
                { label: "Time Logs", value: timeLogs.length },
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

      {/* Overview */}
      {activeTab === "Overview" && (
        <div className="space-y-4">
          {client.internal_notes && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Internal Notes</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{client.internal_notes}</p>
            </div>
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
              <a
                href={client.drive_folder_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open
              </a>
            </div>
          )}
          {!client.internal_notes && !client.drive_folder_url && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Building2 className="w-10 h-10 mx-auto text-slate-200 mb-3" />
              <p className="text-slate-400 text-sm">No additional information yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Projects */}
      {activeTab === "Projects" && (
        <div className="space-y-3">
          {projects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <FolderKanban className="w-10 h-10 mx-auto text-slate-200 mb-3" />
              <p className="text-slate-400 text-sm">No projects yet for this client.</p>
            </div>
          ) : (
            projects.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-indigo-200 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{p.project_name}</h3>
                    {p.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{p.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <StatusBadge status={p.status} />
                    <StatusBadge status={p.priority} />
                  </div>
                </div>
                <div className="mb-3">
                  <ProgressBar value={p.progress_percentage} showLabel />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  {p.project_type && (
                    <span>Type: <strong className="text-slate-700">{p.project_type}</strong></span>
                  )}
                  {p.expected_due_date && (
                    <span>Due: <strong className="text-slate-700">{p.expected_due_date}</strong></span>
                  )}
                  {p.estimated_hours && (
                    <span>Est: <strong className="text-slate-700">{p.estimated_hours}h</strong></span>
                  )}
                  {p.manager && (
                    <span>Manager: <strong className="text-slate-700">{p.manager.full_name}</strong></span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Blockers */}
      {activeTab === "Blockers" && (
        <div className="space-y-3">
          {blockers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <AlertTriangle className="w-10 h-10 mx-auto text-slate-200 mb-3" />
              <p className="text-emerald-600 font-medium text-sm">No blockers — all clear!</p>
            </div>
          ) : (
            blockers.map((b) => (
              <div
                key={b.id}
                className={cn(
                  "bg-white rounded-2xl border p-5",
                  b.status === "Resolved" ? "border-slate-100 opacity-60" : "border-slate-200"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">{b.title}</h3>
                  <div className="flex gap-2 flex-shrink-0 ml-3">
                    <StatusBadge status={b.status} />
                    <StatusBadge status={b.impact} />
                  </div>
                </div>
                {b.description && (
                  <p className="text-sm text-slate-600 mb-3">{b.description}</p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Needed from: </span>
                    <span className="font-medium text-rose-600">{b.needed_from}</span>
                  </div>
                  {b.responsible && (
                    <div>
                      <span className="text-slate-400">Owner: </span>
                      <span className="text-slate-700">{b.responsible.full_name}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400">Requested: </span>
                    <span className="text-slate-700">{b.requested_date}</span>
                  </div>
                  {b.follow_up_date && (
                    <div>
                      <span className="text-slate-400">Follow-up: </span>
                      <span className="text-slate-700">{b.follow_up_date}</span>
                    </div>
                  )}
                  {b.resolved_at && (
                    <div>
                      <span className="text-slate-400">Resolved: </span>
                      <span className="text-emerald-600">{new Date(b.resolved_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                {b.notes && (
                  <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">{b.notes}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Time Logs */}
      {activeTab === "Time Logs" && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Hours", value: `${totalHours.toFixed(1)}h` },
              { label: "Log Entries", value: timeLogs.length },
              {
                label: "Billable Hours",
                value: `${timeLogs.filter((l) => l.billable).reduce((s, l) => s + l.hours, 0).toFixed(1)}h`,
              },
              {
                label: "This Month",
                value: `${timeLogs
                  .filter((l) => {
                    const d = new Date(l.work_date);
                    const now = new Date();
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  })
                  .reduce((s, l) => s + l.hours, 0)
                  .toFixed(1)}h`,
              },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4">
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>

          {timeLogs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Clock className="w-10 h-10 mx-auto text-slate-200 mb-3" />
              <p className="text-slate-400 text-sm">No time logged for this client yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {timeLogs.map((log, idx) => (
                <div
                  key={log.id}
                  className={cn(
                    "flex items-start gap-4 px-5 py-4",
                    idx < timeLogs.length - 1 && "border-b border-slate-100"
                  )}
                >
                  <div className="text-center min-w-12">
                    <p className="text-lg font-bold text-slate-900">{log.hours}h</p>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {log.billable ? "billable" : "non-bill"}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 leading-snug">
                      {log.work_description ?? "No description"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                      {log.user && <span>{log.user.full_name}</span>}
                      <span>·</span>
                      <span>{log.work_date}</span>
                      <span>·</span>
                      <span className="capitalize">{log.category}</span>
                    </div>
                  </div>
                  {log.approved && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 font-medium px-2 py-0.5 rounded-full self-center flex-shrink-0">
                      Approved
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
