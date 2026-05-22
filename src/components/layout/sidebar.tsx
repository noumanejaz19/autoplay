"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, FolderKanban, CheckSquare, Clock,
  HardDrive, Link2, AlertTriangle, PackageCheck, UserCog,
  BarChart3, Sparkles, Settings, ChevronLeft, Zap, Shield,
} from "lucide-react";
import { useState } from "react";
import type { Profile } from "@/lib/supabase/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/time-logs", label: "Time Logs", icon: Clock },
  { href: "/assets", label: "Client Assets", icon: HardDrive },
  { href: "/access", label: "Links & Access", icon: Link2 },
  { href: "/blockers", label: "Blockers", icon: AlertTriangle },
  { href: "/deliverables", label: "Deliverables", icon: PackageCheck },
  { href: "/team", label: "Team", icon: UserCog },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/ai-updates", label: "AI Updates", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  profile: Pick<Profile, "full_name" | "role" | "profile_photo_url"> | null;
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out flex-shrink-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-2.5 animate-fade-in">
            <div className="w-8 h-8 rounded-lg gradient-indigo flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight">Autoplay</span>
              <div className="text-[10px] text-slate-500 leading-none mt-0.5">Client Operations</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg gradient-indigo flex items-center justify-center mx-auto">
            <Zap className="w-4 h-4 text-white" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto sidebar-scroll space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const isAI = item.href === "/ai-updates";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative",
                isActive
                  ? "bg-indigo-500/15 text-indigo-400 border-l-2 border-indigo-500 ml-0 pl-2.5"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "flex-shrink-0 transition-colors",
                  collapsed ? "w-5 h-5" : "w-4 h-4",
                  isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300",
                  isAI && !isActive && "text-violet-500 group-hover:text-violet-400"
                )}
              />
              {!collapsed && (
                <span className={cn(isAI && !isActive && "text-violet-400")}>{item.label}</span>
              )}
              {!collapsed && isAI && !isActive && (
                <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded">
                  AI
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User / Role indicator */}
      <div className="px-3 py-3 border-t border-slate-800">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-slate-800/60">
            {profile?.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt={profile.full_name}
                className="w-7 h-7 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-slate-200 truncate">{profile?.full_name ?? "Loading…"}</div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" />
                {profile?.role === "admin" ? "Admin" : "Team Member"}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {profile?.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt={profile?.full_name ?? "User"}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                {initials}
              </div>
            )}
            <button
              onClick={() => setCollapsed(false)}
              className="w-full flex justify-center text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
