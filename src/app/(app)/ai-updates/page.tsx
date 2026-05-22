"use client";

import { useState } from "react";
import { aiSummaries, clients } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Copy,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  FileText,
  AlertTriangle,
  PackageCheck,
  BarChart3,
  Users,
  Clock,
  Zap,
  CheckCircle2,
} from "lucide-react";

const aiTools = [
  {
    id: "client_update",
    label: "Generate Client Update",
    icon: MessageSquare,
    color: "bg-indigo-50 text-indigo-600 border-indigo-200",
    accent: "bg-indigo-600",
    description: "Auto-generate a professional update to send to the client",
    placeholder:
      "Today we completed the OpenClaw gateway verification, tested Telegram bot connectivity, and confirmed the webhook delivery pipeline. The only pending item is final client access to the LinkedIn export. Once received, we can complete the lead ingestion step.",
  },
  {
    id: "weekly_report",
    label: "Generate Weekly Progress Report",
    icon: BarChart3,
    color: "bg-violet-50 text-violet-600 border-violet-200",
    accent: "bg-violet-600",
    description: "Full weekly summary of progress across all clients",
    placeholder:
      "Week of May 13–17, 2026\n\n✅ Completed this week:\n• FrankBot all 3 Telegram bots deployed and live\n• Apollo.io integration for Tongal fully tested\n• Supplier email sequences ready for go-live\n• ScaleUp kickoff call and ICP documentation complete\n\n⏳ In Progress:\n• MedReach blocked waiting on SMTP credentials\n• BuildRight awaiting VPS access for n8n deployment\n• LinkedIn Sales Navigator integration for Tommy pending access\n\n🔴 Critical Blockers:\n• Dr. Steve — SMTP access not received (30 days overdue)\n• James (BuildRight) — VPS SSH credentials not shared",
  },
  {
    id: "needs_from_client",
    label: "Generate Client Requirements List",
    icon: AlertTriangle,
    color: "bg-amber-50 text-amber-600 border-amber-200",
    accent: "bg-amber-600",
    description: "What we currently need from the client to proceed",
    placeholder:
      "What We Need From You — Summary\n\n🔴 Urgent (Blocking Progress):\n1. LinkedIn Sales Navigator access — blocking lead export pipeline\n2. SMTP credentials — entire MedReach project on hold\n3. VPS SSH access — blocking n8n deployment for BuildRight\n\n🟡 Important (Next Steps):\n4. Apollo team plan license — needed for ScaleUp project\n5. Patient data export format — needed for integration planning\n\nPlease provide the above items as soon as possible to keep the project on schedule.",
  },
  {
    id: "project_summary",
    label: "Summarize Project History",
    icon: FileText,
    color: "bg-cyan-50 text-cyan-600 border-cyan-200",
    accent: "bg-cyan-600",
    description: "Comprehensive summary of everything done on a project",
    placeholder:
      "Project History Summary — OpenClaw Lead Pipeline (Tommy / Tongal)\n\nProject Start: March 1, 2026\nCurrent Phase: Development (68% complete)\n\nCompleted Work:\n• Week 1–2: OpenClaw gateway setup and verification\n• Week 3–5: Apollo.io API integration and testing\n• Week 6–8: Data ingestion pipeline build and validation\n• Week 9: Performance optimization and error handling\n\nPending:\n• LinkedIn Sales Navigator export integration\n• Final pipeline testing with live data\n• Client handover documentation\n\nTime Spent: 84 hours of 120 estimated",
  },
  {
    id: "handover_notes",
    label: "Create Handover Notes",
    icon: PackageCheck,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    accent: "bg-emerald-600",
    description: "Complete technical and operational handover notes",
    placeholder:
      "Handover Notes — FrankBot Telegram Fleet\n\nSystem Overview:\nThree Telegram bots deployed on dedicated VPS running Node.js 20 with PM2 process management.\n\nBot Credentials: Stored in 1Password (FrankBot vault)\nServer: Hostinger VPS — SSH access in 1Password\nAdmin Panel: https://admin.frankbot.io (credentials in vault)\nWebhook URLs: Configured in Telegram Bot API — see docs/webhooks.md\n\nMaintenance:\n• Restart bots: pm2 restart all\n• View logs: pm2 logs\n• Update bot: git pull && pm2 restart all\n\nSupport Contact: bilal@autoplay.ai",
  },
  {
    id: "client_message",
    label: "Draft Message to Client",
    icon: MessageSquare,
    color: "bg-blue-50 text-blue-600 border-blue-200",
    accent: "bg-blue-600",
    description: "Draft a professional WhatsApp or email message to the client",
    placeholder:
      "Hi Tommy,\n\nHope you're doing well! Just a quick update — the Apollo pipeline is live and processing leads as expected. We're ready to integrate the LinkedIn export once we have access.\n\nCould you share the LinkedIn Sales Navigator login or invite me to the team account? We can complete that final step within 24 hours of receiving access.\n\nLet me know if you have any questions!\n\nShahmeer",
  },
  {
    id: "daily_summary",
    label: "Summarize Today's Work",
    icon: Clock,
    color: "bg-orange-50 text-orange-600 border-orange-200",
    accent: "bg-orange-600",
    description: "End-of-day summary of what was accomplished today",
    placeholder:
      "Today's Work Summary — May 17, 2026\n\n👨‍💻 Shahmeer:\n• Continued LinkedIn integration research for Tongal (3h)\n• Email sequence testing for Robert — 50 test emails sent (2h)\n\n🤖 Zara:\n• Follow-up with Dr. Steve on SMTP credentials (2h)\n• Drafted MedReach patient data requirements update\n\n🚀 Omar:\n• ScaleUp infrastructure planning and stack design (2h)\n\n💻 Aisha:\n• FrankBot admin panel production deployment (3h)\n\nTotal: 12h logged across 4 clients\nKey win: FrankBot admin panel deployed successfully",
  },
  {
    id: "manager_summary",
    label: "Generate Manager Summary",
    icon: Users,
    color: "bg-rose-50 text-rose-600 border-rose-200",
    accent: "bg-rose-600",
    description: "Internal summary for Autoplay management — all clients at a glance",
    placeholder:
      "Autoplay Management Summary — Week of May 13, 2026\n\n📊 Portfolio Overview:\n• 6 active clients, 6 projects, $46,000 revenue pipeline\n• 4 open blockers (2 critical, 2 high)\n• Team logged 18h this week across 5 members\n\n🟢 On Track:\n• Frank / FrankBot — 91% done, deploying this week\n• Robert / Supplier — 82% done, testing phase\n• Dean / ScaleUp — onboarding, good momentum\n\n🟡 At Risk:\n• Tommy / Tongal — blocked waiting on LinkedIn access (3 follow-ups)\n• James / BuildRight — blocked on VPS access\n\n🔴 Critical:\n• Dr. Steve / MedReach — ZERO progress due to SMTP block, recommend escalation or project pause\n\nRecommended Actions:\n1. Call Dr. Steve directly — escalate SMTP issue\n2. Give Tommy 48h ultimatum on LinkedIn access\n3. Consider capacity reallocation if MedReach stays blocked",
  },
];

export default function AIUpdatesPage() {
  const [activeClient, setActiveClient] = useState("All");
  const [generated, setGenerated] = useState<Record<string, boolean>>({});
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  function handleGenerate(id: string) {
    setGenerating((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setGenerating((prev) => ({ ...prev, [id]: false }));
      setGenerated((prev) => ({ ...prev, [id]: true }));
      setExpanded((prev) => ({ ...prev, [id]: true }));
    }, 1200);
  }

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-600" />
            AI Updates
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            AI-assisted workflows to generate updates, summaries, and client communications
          </p>
        </div>
      </div>

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Autoplay AI Assistant</h2>
            <p className="text-violet-200 text-sm mt-1 leading-relaxed max-w-2xl">
              Generate professional client updates, project summaries, blocker reports, and internal notes in seconds.
              All output is based on your current project data and can be edited before sending.
            </p>
            <div className="flex gap-2 mt-3">
              {["8 AI workflows", "Client-ready output", "Copy & send instantly"].map((f) => (
                <span key={f} className="text-xs bg-white/20 text-white px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Client filter */}
      <div className="flex gap-2 flex-wrap">
        {["All", ...clients.map(c => c.name)].map((name) => (
          <button
            key={name}
            onClick={() => setActiveClient(name)}
            className={cn("text-sm px-4 py-2 rounded-xl font-medium transition-colors",
              activeClient === name ? "bg-violet-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Saved AI summaries */}
      {aiSummaries.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Saved Summaries</h2>
          {aiSummaries.filter(s => activeClient === "All" || s.clientName.startsWith(activeClient)).map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-violet-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold text-violet-600 uppercase tracking-wide">{s.type.replace(/_/g, " ")}</span>
                  <p className="text-xs text-slate-400">{s.clientName} · {new Date(s.generatedAt).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleCopy(s.id, s.content)}
                  className={cn("p-1.5 rounded-lg transition-colors", copied === s.id ? "bg-emerald-100 text-emerald-600" : "hover:bg-violet-50 text-slate-400 hover:text-violet-600")}
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <pre className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans bg-violet-50/50 rounded-xl p-4">{s.content}</pre>
            </div>
          ))}
        </div>
      )}

      {/* AI Tools */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">AI Workflows</h2>
        <div className="space-y-3">
          {aiTools.map((tool) => {
            const Icon = tool.icon;
            const isGenerating = generating[tool.id];
            const isGenerated = generated[tool.id];
            const isExpanded = expanded[tool.id];

            return (
              <div key={tool.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {/* Tool header */}
                <div className="flex items-center gap-4 p-4">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0", tool.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-800">{tool.label}</h3>
                    <p className="text-xs text-slate-400">{tool.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isGenerated && (
                      <button
                        onClick={() => handleCopy(tool.id, tool.placeholder)}
                        className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                          copied === tool.id
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <Copy className="w-3 h-3" />
                        {copied === tool.id ? "Copied!" : "Copy"}
                      </button>
                    )}
                    <button
                      onClick={() => isGenerated ? setExpanded(prev => ({ ...prev, [tool.id]: !prev[tool.id] })) : handleGenerate(tool.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                        isGenerating
                          ? "bg-violet-100 text-violet-500 cursor-wait"
                          : isGenerated
                          ? "border border-slate-200 text-slate-600 hover:bg-slate-50"
                          : `${tool.accent} text-white hover:opacity-90`
                      )}
                    >
                      {isGenerating ? (
                        <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                      ) : isGenerated ? (
                        <>{isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} {isExpanded ? "Hide" : "Show"}</>
                      ) : (
                        <><Sparkles className="w-3.5 h-3.5" /> Generate</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Generated output */}
                {isGenerated && isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50 p-5 animate-fade-in">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-600">Generated by Autoplay AI</span>
                    </div>
                    <pre className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">{tool.placeholder}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
