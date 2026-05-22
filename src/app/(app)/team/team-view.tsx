"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { Search, Users, Mail, Phone, MapPin, Briefcase, Star } from "lucide-react";
import type { Profile } from "@/lib/supabase/types";

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

const AVAILABILITY_COLOR: Record<string, string> = {
  Available: "bg-emerald-500", Busy: "bg-amber-500",
  Away: "bg-slate-400", "On Leave": "bg-rose-400",
};

export function TeamView({ profiles }: { profiles: Profile[] }) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");

  const departments = Array.from(new Set(profiles.map(p => p.department).filter(Boolean))) as string[];

  const filtered = profiles.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      p.full_name.toLowerCase().includes(q) ||
      (p.job_title ?? "").toLowerCase().includes(q) ||
      (p.department ?? "").toLowerCase().includes(q);
    const matchDept = deptFilter === "All" || p.department === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team</h1>
          <p className="text-slate-500 text-sm mt-1">
            {profiles.length} members · {profiles.filter(p => p.availability_status === "Available").length} available
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Available", count: profiles.filter(p => p.availability_status === "Available").length, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Busy", count: profiles.filter(p => p.availability_status === "Busy").length, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Away", count: profiles.filter(p => p.availability_status === "Away").length, color: "text-slate-600", bg: "bg-slate-50" },
          { label: "Admin", count: profiles.filter(p => p.role === "admin").length, color: "text-indigo-600", bg: "bg-indigo-50" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-3`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 max-w-xs flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search team..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400" />
        </div>
        {departments.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {["All", ...departments].map(d => (
              <button key={d} onClick={() => setDeptFilter(d)} className={cn("text-xs px-3 py-1.5 rounded-lg font-medium transition-colors", deptFilter === d ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{d}</button>
            ))}
          </div>
        )}
      </div>

      {/* Team cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <Users className="w-12 h-12 mx-auto text-slate-200 mb-4" />
          <h3 className="text-slate-700 font-medium">No team members found</h3>
          <p className="text-slate-400 text-sm mt-1">
            {profiles.length === 0 ? "Team members appear here once they sign up." : "Try adjusting your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(member => (
            <div key={member.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4">
              {/* Avatar + name */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {member.profile_photo_url ? (
                      <img src={member.profile_photo_url} alt={member.full_name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <Avatar name={member.full_name} initials={initials(member.full_name)} size="md" />
                    )}
                    <div className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white", AVAILABILITY_COLOR[member.availability_status])} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{member.full_name}</p>
                    <p className="text-xs text-slate-500">{member.job_title ?? "Team Member"}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", member.role === "admin" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600")}>{member.role}</span>
                  <span className="text-[10px] text-slate-400">{member.availability_status}</span>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-1.5 text-xs text-slate-500">
                {member.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
                {member.department && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{member.department}</span>
                  </div>
                )}
                {member.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{member.location}</span>
                  </div>
                )}
                {member.timezone && (
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 text-center">🕐</span>
                    <span>{member.timezone}</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {member.bio && <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{member.bio}</p>}

              {/* Skills */}
              {member.skills.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {member.skills.slice(0, 4).map(s => (
                    <span key={s} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                  {member.skills.length > 4 && <span className="text-[10px] text-slate-400">+{member.skills.length - 4} more</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
