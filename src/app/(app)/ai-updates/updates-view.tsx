"use client";

import { useState, useTransition } from "react";
import { Field, Select } from "@/components/ui/modal";
import { SectionCard } from "@/components/ui/section-card";
import { useToast } from "@/components/ui/toast";
import { Sparkles, Copy, Check, FolderKanban } from "lucide-react";
import { generateProjectUpdate } from "@/app/actions/updates";

type ProjectOption = { id: string; project_name: string; client_name: string | null };

type Props = {
  projects: ProjectOption[];
};

export function UpdatesView({ projects }: Props) {
  const { success, error: toastError } = useToast();
  const [projectId, setProjectId] = useState("");
  const [generated, setGenerated] = useState("");
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    if (!projectId) { toastError("Select a project first."); return; }
    startTransition(async () => {
      const res = await generateProjectUpdate(projectId);
      if (res.error) { toastError(res.error); return; }
      setGenerated(res.text ?? "");
      setCopied(false);
      success("Update generated.");
    });
  }

  async function handleCopy() {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated);
      setCopied(true);
      success("Copied — paste it into the group chat.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toastError("Couldn't copy. Select the text and copy manually.");
    }
  }

  const selected = projects.find((p) => p.id === projectId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-violet-500" /> AI Updates
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Pick a project and generate a ready-to-send update from everything on its project page — then send it in the group chat.
        </p>
      </div>

      <SectionCard title="Generate an update" icon={FolderKanban}>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <Field label="Project" className="flex-1">
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">Select a project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name}{p.client_name ? ` — ${p.client_name}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <button
            onClick={handleGenerate}
            disabled={isPending || !projectId}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl gradient-indigo text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" /> {isPending ? "Generating…" : "Generate update"}
          </button>
        </div>
      </SectionCard>

      {/* Generated output */}
      {generated && (
        <SectionCard
          title="Generated update"
          subtitle={selected ? selected.project_name : undefined}
          icon={Sparkles}
          action={
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          }
        >
          <textarea
            value={generated}
            onChange={(e) => setGenerated(e.target.value)}
            rows={16}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-slate-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 font-mono leading-relaxed resize-y"
          />
          <p className="text-xs text-slate-400 mt-2">Edit anything you like before copying, then paste it into the group chat.</p>
        </SectionCard>
      )}

      {!generated && (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <Sparkles className="w-12 h-12 mx-auto text-slate-200 mb-4" />
          <h3 className="text-slate-700 font-medium">No update generated yet</h3>
          <p className="text-slate-400 text-sm mt-1">Select a project above and hit Generate.</p>
        </div>
      )}
    </div>
  );
}
