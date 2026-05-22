"use client";

import { MetricCard } from "@/components/ui/metric-card";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar } from "@/components/ui/avatar";
import {
  Users, FolderKanban, CheckSquare, AlertTriangle, Clock,
  PackageCheck, TrendingUp, Sparkles, ArrowRight, Activity, Shield,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import type { Client, Project, Blocker, Profile } from "@/lib/supabase/types";

type DashboardProps = {
  profile: Pick<Profile, "full_name"> | null;
  stats: {
    activeClients: number;
    totalClients: number;
    activeProjects: number;
    totalProjects: number;
    tasksDueThisWeek: number;
    openBlockers: number;
    waitingOnClient: number;
    hoursThisWeek: number;
    completedDeliverables: number;
    accessPending: number;
  };
  clients: (Client & { owner: { full_name: string } | null })[];
  projectStatusData: { name: string; value: number; color: string }[];
  clientHealthData: { name: string; value: number; color: string }[];
  teamHoursData: { name: string; hours: number }[];
  urgentBlockers: (Blocker & { client: { company_name: string } | null; responsible: { full_name: string } | null })[];
};

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export function DashboardView({ profile, stats, clients, projectStatusData, clientHealthData, teamHoursData, urgentBlockers }: DashboardProps) {
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{greeting}, {firstName} 👋</h1>
          <p className="text-slate-500 text-sm mt-1">Here&apos;s what&apos;s happening across all your clients today.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors">
          <Sparkles className="w-4 h-4" />
          Generate Weekly Summary
        </button>
      </div>

      {/* Metric cards row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Active Clients" value={stats.activeClients} subtitle={`${stats.totalClients} total`} icon={Users} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
        <MetricCard title="Projects In Progress" value={stats.activeProjects} subtitle={`${stats.totalProjects} total`} icon={FolderKanban} iconColor="text-violet-600" iconBg="bg-violet-50" />
        <MetricCard title="Tasks Due This Week" value={stats.tasksDueThisWeek} subtitle="Needs attention" icon={CheckSquare} iconColor="text-cyan-600" iconBg="bg-cyan-50" />
        <MetricCard title="Open Blockers" value={stats.openBlockers} subtitle={`${stats.waitingOnClient} waiting on client`} icon={AlertTriangle} iconColor="text-rose-600" iconBg="bg-rose-50" trend={{ value: stats.openBlockers > 0 ? "Needs follow-up" : "All clear", positive: stats.openBlockers === 0 }} />
      </div>

      {/* Metric cards row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Hours Logged (Week)" value={`${stats.hoursThisWeek}h`} subtitle="Across all clients" icon={Clock} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <MetricCard title="Completed Deliverables" value={stats.completedDeliverables} subtitle="Approved by clients" icon={PackageCheck} iconColor="text-teal-600" iconBg="bg-teal-50" />
        <MetricCard title="Access Pending" value={stats.accessPending} subtitle="Need action" icon={Shield} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <MetricCard title="Team Members" value={teamHoursData.length} subtitle="Active this week" icon={Users} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard title="Client Health Overview" subtitle="All clients" icon={TrendingUp} className="lg:col-span-2">
          {clients.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No clients yet. <Link href="/clients" className="text-indigo-600">Add your first client.</Link></p>
            </div>
          ) : (
            <div className="space-y-3">
              {clients.slice(0, 8).map(client => (
                <Link key={client.id} href={`/clients/${client.id}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                  <Avatar name={client.company_name} initials={initials(client.company_name)} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800 truncate">{client.company_name}</span>
                      <span className="text-xs text-slate-400 hidden sm:inline truncate">/ {client.contact_person_name}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{client.industry ?? client.preferred_channel}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={client.health_status} />
                    <StatusBadge status={client.status} />
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </Link>
              ))}
              {clients.length > 8 && (
                <Link href="/clients" className="block text-center text-xs text-indigo-600 hover:text-indigo-700 font-medium pt-2">
                  View all {clients.length} clients →
                </Link>
              )}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Project Status" icon={FolderKanban}>
          {projectStatusData.every(d => d.value === 0) ? (
            <div className="text-center py-8 text-slate-400">
              <FolderKanban className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No projects yet.</p>
            </div>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={projectStatusData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                      {projectStatusData.filter(d => d.value > 0).map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {projectStatusData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-xs text-slate-500">{d.name}</span>
                    <span className="text-xs font-semibold text-slate-800 ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Team Hours This Week" icon={Users}>
          {teamHoursData.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No time logs this week.</div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamHoursData} barSize={24}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                  <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Client Health Distribution" icon={TrendingUp}>
          {clientHealthData.every(d => d.value === 0) ? (
            <div className="text-center py-8 text-slate-400 text-sm">No client data.</div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={clientHealthData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                    {clientHealthData.filter(d => d.value > 0).map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Urgent blockers */}
      <SectionCard
        title="Urgent Blockers"
        subtitle={`${urgentBlockers.length} need immediate attention`}
        icon={AlertTriangle}
        action={<Link href="/blockers" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View all</Link>}
      >
        {urgentBlockers.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No urgent blockers. All clear!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {urgentBlockers.map(b => (
              <div key={b.id} className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 border border-rose-100">
                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{b.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{b.client?.company_name} · Needed from {b.needed_from}</p>
                </div>
                <StatusBadge status={b.impact} size="sm" />
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
