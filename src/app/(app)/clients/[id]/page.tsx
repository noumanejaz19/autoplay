"use client";

import { use, useState } from "react";
import {
  getClientById,
  getProjectsByClient,
  getTasksByClient,
  getBlockersByClient,
  getAssetsByClient,
  getAccessByClient,
  getTimelineByClient,
  getDeliverablesByClient,
  getApprovalsByClient,
  getAISummariesByClient,
  teamMembers,
} from "@/lib/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Avatar } from "@/components/ui/avatar";
import { SectionCard } from "@/components/ui/section-card";
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  Globe,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Copy,
  Sparkles,
  Activity,
  PackageCheck,
  Shield,
  FolderKanban,
  HardDrive,
  Link2,
  FileText,
  ChevronRight,
  Pin,
} from "lucide-react";
import Link from "next/link";
import { cn, formatRelativeDate } from "@/lib/utils";

const tabs = [
  "Overview",
  "Projects",
  "Tasks",
  "Timeline",
  "Assets",
  "Links & Access",
  "Blockers",
  "Deliverables",
  "Approvals",
  "AI Summary",
];

const timelineTypeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  status_change: { icon: Activity, color: "text-slate-600", bg: "bg-slate-100" },
  ai_summary: { icon: Sparkles, color: "text-violet-600", bg: "bg-violet-100" },
  blocker_update: { icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-100" },
  delivered: { icon: PackageCheck, color: "text-emerald-600", bg: "bg-emerald-100" },
  follow_up: { icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
  meeting_note: { icon: MessageSquare, color: "text-indigo-600", bg: "bg-indigo-100" },
  decision: { icon: Shield, color: "text-cyan-600", bg: "bg-cyan-100" },
  client_request: { icon: Mail, color: "text-blue-600", bg: "bg-blue-100" },
  internal_note: { icon: FileText, color: "text-slate-600", bg: "bg-slate-100" },
  access_update: { icon: Shield, color: "text-amber-600", bg: "bg-amber-100" },
};

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const client = getClientById(id);
  const [activeTab, setActiveTab] = useState("Overview");

  if (!client) {
    return (
      <div className="text-center py-24">
        <h2 className="text-xl font-semibold text-slate-700">Client not found</h2>
        <Link href="/clients" className="text-indigo-600 text-sm mt-2 inline-block hover:underline">
          ← Back to clients
        </Link>
      </div>
    );
  }

  const projects = getProjectsByClient(id);
  const tasks = getTasksByClient(id);
  const blockers = getBlockersByClient(id);
  const assets = getAssetsByClient(id);
  const accessList = getAccessByClient(id);
  const timeline = getTimelineByClient(id);
  const deliverables = getDeliverablesByClient(id);
  const approvals = getApprovalsByClient(id);
  const aiSummaries = getAISummariesByClient(id);
  const assignedTeam = teamMembers.filter((m) => client.assignedTeam.includes(m.id));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/clients" className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Clients
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 font-medium">{client.name}</span>
      </div>

      {/* Client hero card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Gradient header */}
        <div
          className="h-24 w-full"
          style={{
            background: `linear-gradient(135deg, ${client.color}20 0%, ${client.color}40 100%)`,
          }}
        />
        <div className="px-6 pb-6">
          <div className="flex items-start justify-between -mt-8 mb-5">
            <div
              className="w-16 h-16 rounded-2xl border-4 border-white flex items-center justify-center font-bold text-xl text-white shadow-lg"
              style={{ backgroundColor: client.color }}
            >
              {client.initials}
            </div>
            <div className="flex items-center gap-2 mt-10">
              <StatusBadge status={client.status} showDot />
              <StatusBadge status={client.priority} />
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 transition-colors">
                <Sparkles className="w-3.5 h-3.5" />
                AI Summary
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
                <p className="text-slate-500">{client.company}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{client.contactEmail}</span>
                </div>
                {client.contactPhone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{client.contactPhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span>{client.preferredChannel}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <span>{client.timezone}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">Overall Progress</span>
                    <span className="font-semibold text-slate-700">{client.progress}%</span>
                  </div>
                  <ProgressBar value={client.progress} size="md" />
                </div>
                <StatusBadge status={client.healthScore} size="md" />
              </div>

              {/* Assigned team */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">Team:</span>
                <div className="flex -space-x-2">
                  {assignedTeam.map((m) => (
                    <div
                      key={m.id}
                      className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: m.color }}
                      title={m.name}
                    >
                      {m.initials}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-slate-500">{client.assignedOwner} (owner)</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Stage", value: client.projectStage },
                { label: "Hours Spent", value: `${client.totalHoursSpent}h` },
                { label: "Open Blockers", value: client.openBlockers },
                { label: "Project Type", value: client.projectType },
              ].map((s) => (
                <div key={s.label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400">{s.label}</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{s.value}</p>
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
              activeTab === tab
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Latest update */}
          <SectionCard title="Latest Update" icon={Activity} className="lg:col-span-2">
            <p className="text-sm text-slate-700 leading-relaxed">{client.latestUpdate}</p>
          </SectionCard>

          {/* Completed */}
          <SectionCard title="What We Completed" icon={CheckCircle2}>
            <ul className="space-y-2">
              {client.completedItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </SectionCard>

          {/* Pending */}
          <SectionCard title="What Is Pending" icon={Circle}>
            <ul className="space-y-2">
              {client.pendingItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <Circle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </SectionCard>

          {/* Needed from client */}
          <SectionCard title="What We Need From Client" icon={AlertTriangle}>
            {client.neededFromClient.length === 0 ? (
              <p className="text-sm text-emerald-600">Nothing pending from client. All clear!</p>
            ) : (
              <ul className="space-y-2">
                {client.neededFromClient.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Pinned links */}
          <SectionCard title="Pinned Links" icon={Pin}>
            {client.pinnedLinks.length === 0 ? (
              <p className="text-sm text-slate-400">No pinned links yet.</p>
            ) : (
              <div className="space-y-2">
                {client.pinnedLinks.map((link, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <ExternalLink className="w-4 h-4 text-indigo-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{link.title}</p>
                      <p className="text-xs text-slate-400">{link.type}</p>
                    </div>
                    <button className="text-indigo-500 hover:text-indigo-700 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {activeTab === "Projects" && (
        <div className="space-y-4">
          {projects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <FolderKanban className="w-10 h-10 mx-auto text-slate-200 mb-3" />
              <p className="text-slate-500">No projects yet for this client.</p>
            </div>
          ) : (
            projects.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{p.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <ProgressBar value={p.progress} className="flex-1" />
                  <span className="text-xs font-medium text-slate-600">{p.progress}%</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Phase: <strong className="text-slate-700">{p.currentPhase}</strong></span>
                  <span>Due: <strong className="text-slate-700">{p.dueDate}</strong></span>
                  <span>Time: <strong className="text-slate-700">{p.timeSpent}h / {p.estimatedHours}h</strong></span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex gap-2 flex-wrap">
                    {p.milestones.map((m) => (
                      <div key={m.id} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${m.completed ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                        {m.completed ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                        {m.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "Tasks" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Tasks ({tasks.length})</h3>
          </div>
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
              <StatusBadge status={t.status} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{t.title}</p>
                <p className="text-xs text-slate-400">{t.assignedPerson} · Due {t.dueDate}</p>
              </div>
              <StatusBadge status={t.priority} size="sm" />
              <div className="text-xs text-slate-500 hidden sm:block">{t.loggedHours}h / {t.estimatedHours}h</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "Timeline" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-100" />
            <div className="space-y-6">
              {timeline.length === 0 ? (
                <p className="text-slate-400 text-sm">No timeline entries yet.</p>
              ) : (
                timeline.map((entry) => {
                  const config = timelineTypeConfig[entry.type] || timelineTypeConfig.internal_note;
                  const Icon = config.icon;
                  return (
                    <div key={entry.id} className="flex items-start gap-4 relative">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 z-10 ${config.bg}`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-800">{entry.person}</span>
                          <span className="text-xs text-slate-400">{formatRelativeDate(entry.date)}</span>
                          {entry.visibility === "Internal" && (
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Internal</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{entry.description}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "Assets" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {assets.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <HardDrive className="w-10 h-10 mx-auto text-slate-200 mb-3" />
              <p className="text-slate-500">No assets uploaded yet.</p>
            </div>
          ) : (
            assets.map((asset) => (
              <div key={asset.id} className="bg-white rounded-2xl border border-slate-200 p-4 card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                      <HardDrive className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 truncate max-w-32">{asset.title}</p>
                      <p className="text-xs text-slate-400">{asset.type}</p>
                    </div>
                  </div>
                  {asset.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500" />}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${asset.visibility === "Internal" ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-600"}`}>
                    {asset.visibility}
                  </span>
                  <div className="flex gap-1.5">
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "Links & Access" && (
        <div className="space-y-3">
          {accessList.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start gap-4">
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Link2 className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-800">{item.serviceName}</span>
                  <span className="text-xs text-slate-400">{item.category}</span>
                </div>
                {item.notes && <p className="text-xs text-slate-500 mt-1">{item.notes}</p>}
                {item.actionRequired && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {item.actionRequired}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">📍 {item.secureLocation}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={item.status} />
                <StatusBadge status={item.priority} size="sm" />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "Blockers" && (
        <div className="space-y-3">
          {blockers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <AlertTriangle className="w-10 h-10 mx-auto text-slate-200 mb-3" />
              <p className="text-emerald-600 font-medium">No open blockers!</p>
            </div>
          ) : (
            blockers.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">{b.title}</h3>
                  <div className="flex gap-2">
                    <StatusBadge status={b.status} />
                    <StatusBadge status={b.impact} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-slate-400">What&apos;s blocked: </span><span className="text-slate-700">{b.whatIsBlocked}</span></div>
                  <div><span className="text-slate-400">What we need: </span><span className="text-slate-700">{b.whatWeNeed}</span></div>
                  <div><span className="text-slate-400">Needed from: </span><span className="font-medium text-rose-600">{b.neededFrom}</span></div>
                  <div><span className="text-slate-400">Owner: </span><span className="text-slate-700">{b.owner}</span></div>
                  <div><span className="text-slate-400">Requested: </span><span className="text-slate-700">{b.requestedDate}</span></div>
                  <div><span className="text-slate-400">Follow-up: </span><span className="text-slate-700">{b.followUpDate}</span></div>
                </div>
                {b.notes && <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">{b.notes}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "Deliverables" && (
        <div className="space-y-3">
          {deliverables.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <PackageCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{d.title}</p>
                <p className="text-xs text-slate-400">{d.type} · {d.createdAt}</p>
              </div>
              <StatusBadge status={d.status} />
              {d.link && (
                <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "Approvals" && (
        <div className="space-y-3">
          {approvals.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
              <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{a.title}</p>
                <p className="text-xs text-slate-400">{a.type} · Requested by {a.requestedBy}</p>
                {a.notes && <p className="text-xs text-slate-500 mt-0.5">{a.notes}</p>}
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      )}

      {activeTab === "AI Summary" && (
        <div className="space-y-4">
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-violet-600" />
            <p className="text-sm text-violet-700">AI-generated summaries for {client.name}. Click generate to create new ones.</p>
            <button className="ml-auto px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 transition-colors">
              Generate New
            </button>
          </div>
          {aiSummaries.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <span className="text-xs font-semibold text-violet-600 uppercase tracking-wide">{s.type.replace(/_/g, " ")}</span>
                <span className="text-xs text-slate-400 ml-auto">{new Date(s.generatedAt).toLocaleString()}</span>
              </div>
              <pre className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">{s.content}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
