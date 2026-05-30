"use client";

import { useState, useMemo } from "react";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";
import {
  BarChart3, Clock, Users, AlertTriangle, PackageCheck,
  TrendingUp, Filter,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";

type Props = {
  clients: { id: string; company_name: string }[];
  allProjects: { id: string; project_name: string; status: string; progress_percentage: number; client_id: string | null }[];
  allTimeLogs: { id: string; work_date: string; hours: number; user_id: string; client_id: string | null; billable: boolean; category: string; user: { full_name: string } | null }[];
  allBlockers: { id: string; status: string; impact: string; client_id: string }[];
  allDeliverables: { id: string; status: string; client_id: string }[];
};

export function ReportsView({ clients, allProjects, allTimeLogs, allBlockers, allDeliverables }: Props) {
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  function toggleClient(id: string) {
    setSelectedClients(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  }

  const activeClientIds = selectedClients.length > 0 ? selectedClients : clients.map(c => c.id);

  const timeLogs = useMemo(() => {
    return allTimeLogs.filter(t => {
      const clientMatch = !t.client_id || activeClientIds.includes(t.client_id);
      const fromMatch = !dateFrom || t.work_date >= dateFrom;
      const toMatch = !dateTo || t.work_date <= dateTo;
      return clientMatch && fromMatch && toMatch;
    });
  }, [allTimeLogs, activeClientIds, dateFrom, dateTo]);

  const projects = useMemo(() =>
    allProjects.filter(p => !p.client_id || activeClientIds.includes(p.client_id)),
    [allProjects, activeClientIds]
  );

  const blockers = useMemo(() =>
    allBlockers.filter(b => activeClientIds.includes(b.client_id)),
    [allBlockers, activeClientIds]
  );

  const deliverables = useMemo(() =>
    allDeliverables.filter(d => activeClientIds.includes(d.client_id)),
    [allDeliverables, activeClientIds]
  );

  const totalHours = timeLogs.reduce((s, t) => s + t.hours, 0);
  const billableHours = timeLogs.filter(t => t.billable).reduce((s, t) => s + t.hours, 0);

  // Hours by client chart
  const clientHoursData = clients
    .filter(c => activeClientIds.includes(c.id))
    .map(c => ({
      name: c.company_name.split(" ")[0],
      hours: timeLogs.filter(t => t.client_id === c.id).reduce((s, t) => s + t.hours, 0),
    }))
    .filter(d => d.hours > 0);

  // Weekly hours trend
  const weeklyMap: Record<string, number> = {};
  timeLogs.forEach(t => {
    const d = new Date(t.work_date);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    weeklyMap[key] = (weeklyMap[key] ?? 0) + t.hours;
  });
  const weeklyHoursData = Object.entries(weeklyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([week, hours]) => ({ week: week.slice(5), hours: Math.round(hours * 10) / 10 }));

  // Member hours
  const memberMap: Record<string, number> = {};
  timeLogs.forEach(t => {
    const name = t.user?.full_name?.split(" ")[0] ?? "Unknown";
    memberMap[name] = (memberMap[name] ?? 0) + t.hours;
  });
  const memberHoursData = Object.entries(memberMap)
    .sort(([, a], [, b]) => b - a)
    .map(([name, hours]) => ({ name, hours: Math.round(hours * 10) / 10 }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 text-sm mt-1">Filter by client and date range to generate your report</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-semibold text-slate-700">Report Filters</span>
        </div>

        {/* Client multi-select */}
        <div>
          <p className="text-xs text-slate-500 font-medium mb-2">Clients (select none = all clients)</p>
          <div className="flex gap-2 flex-wrap">
            {clients.map(c => (
              <button
                key={c.id}
                onClick={() => toggleClient(c.id)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors",
                  selectedClients.includes(c.id)
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                )}
              >
                {c.company_name}
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium whitespace-nowrap">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-medium whitespace-nowrap">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          {(dateFrom || dateTo || selectedClients.length > 0) && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); setSelectedClients([]); }}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Hours Logged", value: `${totalHours.toFixed(1)}h`, icon: Clock, color: "text-indigo-600" },
          { label: "Billable Hours", value: `${billableHours.toFixed(1)}h`, icon: BarChart3, color: "text-emerald-600" },
          { label: "Active Projects", value: projects.filter(p => !["Completed", "Cancelled"].includes(p.status)).length, icon: TrendingUp, color: "text-violet-600" },
          { label: "Open Blockers", value: blockers.filter(b => b.status === "Open").length, icon: AlertTriangle, color: "text-rose-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Weekly Hours Trend" icon={Clock}>
          <div className="h-52">
            {weeklyHoursData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyHoursData}>
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                  <Line type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: "#6366f1", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data for selected range</div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Hours by Client" icon={Users}>
          <div className="h-52">
            {clientHoursData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientHoursData} barSize={28}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                  <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data for selected clients</div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Team hours breakdown */}
      {memberHoursData.length > 0 && (
        <SectionCard title="Hours by Team Member" icon={Users}>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberHoursData} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                <Bar dataKey="hours" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}

      {/* Project progress */}
      {projects.length > 0 && (
        <SectionCard title="Project Progress" icon={TrendingUp}>
          <div className="space-y-3">
            {projects.map(p => (
              <div key={p.id} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-700 truncate">{p.project_name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={p.status} size="sm" />
                      <span className="text-xs font-bold text-slate-700">{p.progress_percentage}%</span>
                    </div>
                  </div>
                  <ProgressBar value={p.progress_percentage} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Blockers summary */}
      {blockers.length > 0 && (
        <SectionCard title="Blockers Summary" icon={AlertTriangle}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Open", count: blockers.filter(b => b.status === "Open").length, color: "text-rose-600", bg: "bg-rose-50" },
              { label: "In Progress", count: blockers.filter(b => b.status === "In Progress").length, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Critical", count: blockers.filter(b => b.impact === "Critical").length, color: "text-rose-700", bg: "bg-rose-100" },
              { label: "Resolved", count: blockers.filter(b => b.status === "Resolved").length, color: "text-emerald-600", bg: "bg-emerald-50" },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Deliverables summary */}
      {deliverables.length > 0 && (
        <SectionCard title="Deliverables Summary" icon={PackageCheck}>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {["Draft", "Ready", "Sent", "Approved", "Needs Revision"].map(status => (
              <div key={status} className="bg-slate-50 rounded-xl px-4 py-3">
                <p className="text-2xl font-bold text-slate-700">{deliverables.filter(d => d.status === status).length}</p>
                <p className="text-xs text-slate-500">{status}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
