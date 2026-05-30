"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Modal, Field, Input, Select, ModalBtn } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Search, Users, Mail, Phone, MapPin, Briefcase, UserPlus, Shield } from "lucide-react";
import type { Profile } from "@/lib/supabase/types";
import { inviteUserAction } from "@/app/actions/profiles";
import { getPermissions, updatePermissionsAction } from "@/app/actions/permissions";

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

const AVAILABILITY_COLOR: Record<string, string> = {
  Available: "bg-emerald-500", Busy: "bg-amber-500",
  Away: "bg-slate-400", "On Leave": "bg-rose-400",
};

type PermState = {
  can_view_all_clients: boolean;
  can_view_time_logs: boolean;
  can_view_reports: boolean;
  can_post_updates: boolean;
  can_manage_assets: boolean;
  can_manage_tasks: boolean;
  allowed_client_ids: string[];
};

const DEFAULT_PERMS: PermState = {
  can_view_all_clients: false,
  can_view_time_logs: true,
  can_view_reports: false,
  can_post_updates: true,
  can_manage_assets: true,
  can_manage_tasks: true,
  allowed_client_ids: [],
};

const BLANK_INVITE = { email: "", full_name: "", role: "user", job_title: "", department: "" };

export function TeamView({
  profiles,
  clients,
  isAdmin,
}: {
  profiles: Profile[];
  clients?: { id: string; company_name: string }[];
  isAdmin: boolean;
}) {
  const { success, error: toastError } = useToast();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState(BLANK_INVITE);
  const [permTarget, setPermTarget] = useState<Profile | null>(null);
  const [perms, setPerms] = useState<PermState>(DEFAULT_PERMS);
  const [isPending, startTransition] = useTransition();

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

  function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await inviteUserAction(fd);
      if ("error" in res && res.error) { toastError(res.error); return; }
      if ("message" in res && res.message) success(res.message as string);
      else success("Invite sent successfully.");
      setInviteOpen(false);
      setInviteForm(BLANK_INVITE);
    });
  }

  async function openPerms(member: Profile) {
    setPermTarget(member);
    const data = await getPermissions(member.id);
    if (data) {
      setPerms({
        can_view_all_clients: (data as Record<string, unknown>).can_view_all_clients as boolean ?? false,
        can_view_time_logs: (data as Record<string, unknown>).can_view_time_logs as boolean ?? true,
        can_view_reports: (data as Record<string, unknown>).can_view_reports as boolean ?? false,
        can_post_updates: (data as Record<string, unknown>).can_post_updates as boolean ?? true,
        can_manage_assets: (data as Record<string, unknown>).can_manage_assets as boolean ?? true,
        can_manage_tasks: (data as Record<string, unknown>).can_manage_tasks as boolean ?? true,
        allowed_client_ids: ((data as Record<string, unknown>).allowed_client_ids as string[]) ?? [],
      });
    } else {
      setPerms(DEFAULT_PERMS);
    }
  }

  function handlePermsSave() {
    if (!permTarget) return;
    const fd = new FormData();
    fd.set("can_view_all_clients", String(perms.can_view_all_clients));
    fd.set("can_view_time_logs", String(perms.can_view_time_logs));
    fd.set("can_view_reports", String(perms.can_view_reports));
    fd.set("can_post_updates", String(perms.can_post_updates));
    fd.set("can_manage_assets", String(perms.can_manage_assets));
    fd.set("can_manage_tasks", String(perms.can_manage_tasks));
    perms.allowed_client_ids.forEach(id => fd.append("allowed_client_ids", id));
    startTransition(async () => {
      const res = await updatePermissionsAction(permTarget.id, fd);
      if (res.error) { toastError(res.error); return; }
      success("Permissions updated.");
      setPermTarget(null);
    });
  }

  function toggleClientPerm(clientId: string) {
    setPerms(p => ({
      ...p,
      allowed_client_ids: p.allowed_client_ids.includes(clientId)
        ? p.allowed_client_ids.filter(id => id !== clientId)
        : [...p.allowed_client_ids, clientId],
    }));
  }

  const PERM_TOGGLES: { key: keyof PermState; label: string; hint: string }[] = [
    { key: "can_view_all_clients", label: "View All Clients", hint: "Can see all clients (overrides client list)" },
    { key: "can_view_time_logs", label: "View Time Logs", hint: "Can view and log time" },
    { key: "can_view_reports", label: "View Reports", hint: "Can access the reports page" },
    { key: "can_post_updates", label: "Post Updates", hint: "Can post client updates" },
    { key: "can_manage_assets", label: "Manage Assets", hint: "Can upload and manage assets" },
    { key: "can_manage_tasks", label: "Manage Tasks", hint: "Can create and edit tasks" },
  ];

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
        {isAdmin && (
          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-indigo text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <UserPlus className="w-4 h-4" /> Invite Member
          </button>
        )}
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
            {profiles.length === 0 ? "Invite your first team member to get started." : "Try adjusting your search."}
          </p>
          {isAdmin && profiles.length === 0 && (
            <button onClick={() => setInviteOpen(true)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-indigo text-white text-sm font-medium">
              <UserPlus className="w-4 h-4" /> Invite Member
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(member => (
            <div key={member.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4">
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

              <div className="space-y-1.5 text-xs text-slate-500">
                {member.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{member.phone}</span>
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

              {member.bio && <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{member.bio}</p>}

              {member.skills.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {member.skills.slice(0, 4).map(s => (
                    <span key={s} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                  {member.skills.length > 4 && <span className="text-[10px] text-slate-400">+{member.skills.length - 4} more</span>}
                </div>
              )}

              {isAdmin && member.role !== "admin" && (
                <button
                  onClick={() => openPerms(member)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium transition-colors border-t border-slate-100 pt-3"
                >
                  <Shield className="w-3.5 h-3.5" /> Manage Permissions
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        open={inviteOpen}
        onClose={() => { setInviteOpen(false); setInviteForm(BLANK_INVITE); }}
        title="Invite Team Member"
        subtitle="They'll receive an email to set their password and log in"
        size="md"
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => { setInviteOpen(false); setInviteForm(BLANK_INVITE); }}>Cancel</ModalBtn>
            <ModalBtn form="invite-form" type="submit" disabled={isPending}>
              {isPending ? "Sending…" : "Send Invite"}
            </ModalBtn>
          </>
        }
      >
        <form id="invite-form" onSubmit={handleInvite}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" required className="sm:col-span-2">
              <Input name="full_name" placeholder="e.g. Sarah Ahmed" value={inviteForm.full_name} onChange={e => setInviteForm(p => ({ ...p, full_name: e.target.value }))} required />
            </Field>
            <Field label="Email Address" required className="sm:col-span-2">
              <Input name="email" type="email" placeholder="sarah@autoplay.ai" value={inviteForm.email} onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))} required />
            </Field>
            <Field label="Role">
              <Select name="role" value={inviteForm.role} onChange={e => setInviteForm(p => ({ ...p, role: e.target.value }))}>
                <option value="user">Team Member</option>
                <option value="admin">Admin</option>
              </Select>
            </Field>
            <Field label="Job Title">
              <Input name="job_title" placeholder="e.g. AI Engineer" value={inviteForm.job_title} onChange={e => setInviteForm(p => ({ ...p, job_title: e.target.value }))} />
            </Field>
            <Field label="Department" className="sm:col-span-2">
              <Input name="department" placeholder="e.g. Engineering, Operations" value={inviteForm.department} onChange={e => setInviteForm(p => ({ ...p, department: e.target.value }))} />
            </Field>
          </div>
        </form>
      </Modal>

      {/* Permissions Modal */}
      <Modal
        open={!!permTarget}
        onClose={() => setPermTarget(null)}
        title="Manage Permissions"
        subtitle={permTarget?.full_name}
        size="md"
        footer={
          <>
            <ModalBtn variant="secondary" onClick={() => setPermTarget(null)}>Cancel</ModalBtn>
            <ModalBtn onClick={handlePermsSave} disabled={isPending}>
              {isPending ? "Saving…" : "Save Permissions"}
            </ModalBtn>
          </>
        }
      >
        <div className="space-y-5">
          {/* Feature toggles */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Feature Access</p>
            <div className="space-y-2">
              {PERM_TOGGLES.map(({ key, label, hint }) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{label}</p>
                    <p className="text-xs text-slate-400">{hint}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPerms(p => ({ ...p, [key]: !p[key as keyof PermState] }))}
                    className={cn(
                      "w-10 h-5 rounded-full transition-colors relative flex-shrink-0",
                      perms[key as keyof PermState] ? "bg-indigo-600" : "bg-slate-200"
                    )}
                  >
                    <span className={cn(
                      "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                      perms[key as keyof PermState] ? "translate-x-5" : "translate-x-0.5"
                    )} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Client access (only shown if not "view all") */}
          {!perms.can_view_all_clients && clients && clients.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Client Access</p>
              <p className="text-xs text-slate-400 mb-3">Select which clients this member can see. Leave empty to allow no client access.</p>
              <div className="flex gap-2 flex-wrap">
                {clients.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleClientPerm(c.id)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors",
                      perms.allowed_client_ids.includes(c.id)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                    )}
                  >
                    {c.company_name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
