"use client";

import { clients, projects, timeLogs, blockers, deliverables, accessItems } from "@/lib/mock-data";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  BarChart3,
  Download,
  Copy,
  FileText,
  Users,
  Clock,
  AlertTriangle,
  PackageCheck,
  Shield,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const weeklyHoursData = [
  { week: "Apr W1", hours: 28 },
  { week: "Apr W2", hours: 36 },
  { week: "Apr W3", hours: 42 },
  { week: "Apr W4", hours: 39 },
  { week: "May W1", hours: 45 },
  { week: "May W2", hours: 18 },
];

const clientHoursData = clients.map((c) => ({
  name: c.name,
  hours: c.totalHoursSpent,
}));

const projectProgressData = projects.map((p) => ({
  name: p.name.split(" ").slice(0, 2).join(" "),
  progress: p.progress,
}));

const COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e"];

const reportCards = [
  {
    title: "Weekly Client Progress Report",
    description: "Summary of all client progress, milestones, and updates this week",
    icon: TrendingUp,
    color: "bg-indigo-50 text-indigo-600",
    badge: "Weekly",
  },
  {
    title: "Monthly Time Report",
    description: "Breakdown of hours logged per client, team member, and category",
    icon: Clock,
    color: "bg-emerald-50 text-emerald-600",
    badge: "Monthly",
  },
  {
    title: "Blocker Report",
    description: "All open blockers grouped by client and impact level",
    icon: AlertTriangle,
    color: "bg-rose-50 text-rose-600",
    badge: "On-demand",
  },
  {
    title: "Team Workload Report",
    description: "Current workload distribution and capacity per team member",
    icon: Users,
    color: "bg-violet-50 text-violet-600",
    badge: "Weekly",
  },
  {
    title: "Client Health Report",
    description: "Health scores, risk levels, and recommended actions for all clients",
    icon: TrendingUp,
    color: "bg-cyan-50 text-cyan-600",
    badge: "Weekly",
  },
  {
    title: "Deliverables Report",
    description: "Status of all deliverables — drafts, sent, approved, needs revision",
    icon: PackageCheck,
    color: "bg-teal-50 text-teal-600",
    badge: "On-demand",
  },
  {
    title: "Access Pending Report",
    description: "All pending and blocked access items requiring client action",
    icon: Shield,
    color: "bg-amber-50 text-amber-600",
    badge: "On-demand",
  },
  {
    title: "Project Profitability",
    description: "Revenue vs hours spent per project (billing placeholder)",
    icon: DollarSign,
    color: "bg-emerald-50 text-emerald-600",
    badge: "Monthly",
  },
];

function ReportCard({ title, description, icon: Icon, color, badge }: typeof reportCards[0]) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wide">
          {badge}
        </span>
      </div>
      <h3 className="font-semibold text-slate-800 text-sm mb-1">{title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed mb-4">{description}</p>
      <div className="flex gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors">
          <FileText className="w-3 h-3" />
          Generate
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors">
          <Download className="w-3 h-3" />
          Export PDF
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors">
          <Copy className="w-3 h-3" />
          CSV
        </button>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const totalRevenue = clients.reduce((s, c) => s + (c.revenue || 0), 0);
  const totalHours = timeLogs.reduce((s, t) => s + t.hours, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 text-sm mt-1">Generate, export, and share management reports</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-indigo text-white text-sm font-medium hover:opacity-90 transition-opacity">
          <Download className="w-4 h-4" />
          Export All
        </button>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Total Revenue Pipeline</p>
          <p className="text-2xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Total Hours Logged</p>
          <p className="text-2xl font-bold text-slate-900">{totalHours}h</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Active Clients</p>
          <p className="text-2xl font-bold text-slate-900">{clients.filter(c => c.status === "Active").length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Open Blockers</p>
          <p className="text-2xl font-bold text-rose-600">{blockers.filter(b => b.status === "Open").length}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Weekly Hours Trend" icon={Clock}>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyHoursData}>
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                <Line type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: "#6366f1", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Hours by Client" icon={Users}>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientHoursData} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {clientHoursData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* Project progress */}
      <SectionCard title="Project Progress Overview" icon={TrendingUp}>
        <div className="space-y-3">
          {projects.map((p, i) => (
            <div key={p.id} className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-700 truncate">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={p.status} size="sm" />
                    <span className="text-xs font-bold text-slate-700">{p.progress}%</span>
                  </div>
                </div>
                <ProgressBar value={p.progress} colorClass={`bg-[${COLORS[i % COLORS.length]}]`} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Client health table */}
      <SectionCard title="Client Health Summary" subtitle="Full client health report" icon={TrendingUp}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                <th className="pb-3 font-semibold">Client</th>
                <th className="pb-3 font-semibold">Health</th>
                <th className="pb-3 font-semibold">Progress</th>
                <th className="pb-3 font-semibold">Blockers</th>
                <th className="pb-3 font-semibold">Hours</th>
                <th className="pb-3 font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 font-medium text-slate-800">{c.name} / {c.company}</td>
                  <td className="py-3"><StatusBadge status={c.healthScore} /></td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={c.progress} className="w-20" />
                      <span className="text-xs text-slate-500">{c.progress}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    {c.openBlockers > 0 ? (
                      <span className="text-rose-600 font-medium">{c.openBlockers}</span>
                    ) : (
                      <span className="text-emerald-600">None</span>
                    )}
                  </td>
                  <td className="py-3 text-slate-600">{c.totalHoursSpent}h</td>
                  <td className="py-3 text-slate-600">{c.revenue ? `$${c.revenue.toLocaleString()}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Report cards */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Available Reports</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {reportCards.map((r) => (
            <ReportCard key={r.title} {...r} />
          ))}
        </div>
      </div>
    </div>
  );
}
