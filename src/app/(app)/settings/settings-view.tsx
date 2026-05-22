"use client";

import { useState, useTransition } from "react";
import { SectionCard } from "@/components/ui/section-card";
import { Field, Input, Textarea, Select } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  Settings, Building2, Palette, Shield, Bell, ChevronRight, Zap, Check, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/supabase/types";
import { updateProfileAction } from "@/app/actions/profiles";

const accentColors = [
  { name: "Indigo", value: "#6366f1" }, { name: "Violet", value: "#8b5cf6" },
  { name: "Cyan", value: "#06b6d4" }, { name: "Emerald", value: "#10b981" },
  { name: "Rose", value: "#f43f5e" }, { name: "Amber", value: "#f59e0b" },
];

const navItems = [
  { id: "profile", label: "My Profile", icon: User },
  { id: "company", label: "Company", icon: Building2 },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "roles", label: "Roles & Permissions", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export function SettingsView({ profile }: { profile: Profile | null }) {
  const { success, error: toastError } = useToast();
  const [activeSection, setActiveSection] = useState("profile");
  const [selectedColor, setSelectedColor] = useState("#6366f1");
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    job_title: profile?.job_title ?? "",
    department: profile?.department ?? "",
    phone: profile?.phone ?? "",
    timezone: profile?.timezone ?? "UTC",
    location: profile?.location ?? "",
    bio: profile?.bio ?? "",
    skills: profile?.skills.join(", ") ?? "",
    years_experience: String(profile?.years_experience ?? ""),
    linkedin_url: profile?.linkedin_url ?? "",
    portfolio_url: profile?.portfolio_url ?? "",
    availability_status: profile?.availability_status ?? "Available",
  });

  function f(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateProfileAction(fd);
      if (res.error) { toastError(res.error); return; }
      success("Profile updated successfully.");
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your profile and workspace configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn("w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-slate-100 last:border-0",
                    activeSection === item.id ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Icon className={cn("w-4 h-4", activeSection === item.id ? "text-indigo-600" : "text-slate-400")} />
                  {item.label}
                  <ChevronRight className={cn("w-3.5 h-3.5 ml-auto", activeSection === item.id ? "text-indigo-400" : "text-slate-300")} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile section */}
          {activeSection === "profile" && (
            <SectionCard title="My Profile" icon={User}>
              {!profile ? (
                <p className="text-sm text-slate-500">Profile not found. Make sure you are logged in.</p>
              ) : (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Full Name" required>
                      <Input name="full_name" value={form.full_name} onChange={e => f("full_name", e.target.value)} required />
                    </Field>
                    <Field label="Job Title">
                      <Input name="job_title" placeholder="e.g. Growth Manager" value={form.job_title} onChange={e => f("job_title", e.target.value)} />
                    </Field>
                    <Field label="Department">
                      <Input name="department" placeholder="e.g. Operations" value={form.department} onChange={e => f("department", e.target.value)} />
                    </Field>
                    <Field label="Phone">
                      <Input name="phone" type="tel" placeholder="+1 555-000-0000" value={form.phone} onChange={e => f("phone", e.target.value)} />
                    </Field>
                    <Field label="Timezone">
                      <Select name="timezone" value={form.timezone} onChange={e => f("timezone", e.target.value)}>
                        {["UTC", "EST", "PST", "CST", "MST", "GMT", "PKT", "GST", "WAT"].map(o => <option key={o}>{o}</option>)}
                      </Select>
                    </Field>
                    <Field label="Location">
                      <Input name="location" placeholder="e.g. New York, NY" value={form.location} onChange={e => f("location", e.target.value)} />
                    </Field>
                    <Field label="Availability Status">
                      <Select name="availability_status" value={form.availability_status} onChange={e => f("availability_status", e.target.value)}>
                        {["Available", "Busy", "Away", "On Leave"].map(o => <option key={o}>{o}</option>)}
                      </Select>
                    </Field>
                    <Field label="Years of Experience">
                      <Input name="years_experience" type="number" min="0" value={form.years_experience} onChange={e => f("years_experience", e.target.value)} />
                    </Field>
                    <Field label="Skills" hint="Comma-separated" className="sm:col-span-2">
                      <Input name="skills" placeholder="LinkedIn Outreach, AI, Automation" value={form.skills} onChange={e => f("skills", e.target.value)} />
                    </Field>
                    <Field label="Bio" className="sm:col-span-2">
                      <Textarea name="bio" placeholder="A short bio about yourself..." value={form.bio} onChange={e => f("bio", e.target.value)} />
                    </Field>
                    <Field label="LinkedIn URL">
                      <Input name="linkedin_url" type="url" placeholder="https://linkedin.com/in/..." value={form.linkedin_url} onChange={e => f("linkedin_url", e.target.value)} />
                    </Field>
                    <Field label="Portfolio URL">
                      <Input name="portfolio_url" type="url" placeholder="https://..." value={form.portfolio_url} onChange={e => f("portfolio_url", e.target.value)} />
                    </Field>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={isPending} className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-indigo text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60">
                      {isPending ? "Saving…" : "Save Profile"}
                    </button>
                  </div>
                </form>
              )}
            </SectionCard>
          )}

          {activeSection === "company" && (
            <SectionCard title="Company Profile" icon={Building2}>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl gradient-indigo flex items-center justify-center">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Company Logo</p>
                    <p className="text-xs text-slate-400 mt-1">Upload via Supabase Storage (coming soon)</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Company Name", defaultValue: "Autoplay" },
                    { label: "Tagline", defaultValue: "Client Operations Platform" },
                    { label: "Email", defaultValue: "team@autoplay.ai" },
                    { label: "Website", defaultValue: "autoplay.ai" },
                  ].map(field => (
                    <div key={field.label}>
                      <label className="text-xs font-medium text-slate-500 block mb-1">{field.label}</label>
                      <input type="text" defaultValue={field.defaultValue} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400">Company profile settings coming soon.</p>
              </div>
            </SectionCard>
          )}

          {activeSection === "branding" && (
            <SectionCard title="Branding & Appearance" icon={Palette}>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-3">Accent Color</label>
                  <div className="flex gap-3">
                    {accentColors.map(c => (
                      <button key={c.value} onClick={() => setSelectedColor(c.value)} className="flex flex-col items-center gap-1.5">
                        <div className={cn("w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center", selectedColor === c.value ? "border-slate-800 scale-110" : "border-transparent")} style={{ backgroundColor: c.value }}>
                          {selectedColor === c.value && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span className="text-[10px] text-slate-500">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-3">Theme</label>
                  <div className="flex gap-3">
                    {["Light", "Dark (Coming Soon)"].map(t => (
                      <button key={t} disabled={t !== "Light"} className={cn("px-4 py-2 rounded-xl text-sm border transition-colors", t === "Light" ? "bg-white border-indigo-400 text-indigo-600 font-medium" : "border-slate-200 text-slate-400 cursor-not-allowed")}>{t}</button>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {activeSection === "roles" && (
            <SectionCard title="Team Roles & Permissions" icon={Shield}>
              <div className="space-y-3">
                {[
                  { name: "Admin", description: "Full access to all features and data", color: "bg-rose-100 text-rose-700" },
                  { name: "User", description: "Access assigned clients and projects only", color: "bg-emerald-100 text-emerald-700" },
                ].map(role => (
                  <div key={role.name} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", role.color)}>{role.name}</span>
                    <p className="text-sm text-slate-600 flex-1">{role.description}</p>
                  </div>
                ))}
                <p className="text-xs text-slate-400 pt-2">Roles are enforced at the database level via Row Level Security. Contact your admin to change roles.</p>
              </div>
            </SectionCard>
          )}

          {activeSection === "notifications" && (
            <SectionCard title="Notification Preferences" icon={Bell}>
              <div className="space-y-4">
                {[
                  { label: "New blocker added", description: "Notify when a blocker is created" },
                  { label: "Task assigned to you", description: "Get notified on new task assignments" },
                  { label: "Deliverable approved", description: "Alert when client approves a deliverable" },
                  { label: "Weekly summary", description: "Auto-generate weekly summary report" },
                ].map(n => (
                  <div key={n.label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{n.label}</p>
                      <p className="text-xs text-slate-400">{n.description}</p>
                    </div>
                    <div className="w-10 h-5 rounded-full bg-indigo-500 flex items-center justify-end px-0.5 cursor-pointer">
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-slate-400">Email notifications coming soon.</p>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
