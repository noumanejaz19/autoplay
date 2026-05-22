import { cn } from "@/lib/utils";

type Variant =
  | "active"
  | "completed"
  | "paused"
  | "at-risk"
  | "onboarding"
  | "healthy"
  | "good"
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "open"
  | "in-progress"
  | "resolved"
  | "pending"
  | "received"
  | "configured"
  | "tested"
  | "not-working"
  | "need-client"
  | "revoked"
  | "draft"
  | "ready"
  | "sent"
  | "approved"
  | "rejected"
  | "changes-requested"
  | "blocked"
  | "waiting-client"
  | "waiting-internal"
  | "backlog"
  | "escalated"
  | "planning"
  | "cancelled"
  | "default";

const variantStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-slate-100 text-slate-600 border-slate-200",
  paused: "bg-amber-50 text-amber-700 border-amber-200",
  "at-risk": "bg-rose-50 text-rose-700 border-rose-200",
  onboarding: "bg-cyan-50 text-cyan-700 border-cyan-200",
  healthy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  good: "bg-emerald-50 text-emerald-600 border-emerald-200",
  critical: "bg-rose-50 text-rose-700 border-rose-200",
  high: "bg-rose-50 text-rose-600 border-rose-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-50 text-slate-600 border-slate-200",
  open: "bg-rose-50 text-rose-700 border-rose-200",
  "in-progress": "bg-indigo-50 text-indigo-700 border-indigo-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  received: "bg-cyan-50 text-cyan-700 border-cyan-200",
  configured: "bg-indigo-50 text-indigo-700 border-indigo-200",
  tested: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "not-working": "bg-rose-50 text-rose-700 border-rose-200",
  "need-client": "bg-amber-50 text-amber-700 border-amber-200",
  revoked: "bg-slate-100 text-slate-500 border-slate-200",
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  ready: "bg-cyan-50 text-cyan-700 border-cyan-200",
  sent: "bg-indigo-50 text-indigo-700 border-indigo-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  "changes-requested": "bg-amber-50 text-amber-700 border-amber-200",
  blocked: "bg-rose-50 text-rose-700 border-rose-200",
  "waiting-client": "bg-amber-50 text-amber-700 border-amber-200",
  "waiting-internal": "bg-violet-50 text-violet-700 border-violet-200",
  backlog: "bg-slate-100 text-slate-500 border-slate-200",
  escalated: "bg-rose-100 text-rose-800 border-rose-300",
  planning: "bg-violet-50 text-violet-700 border-violet-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
  default: "bg-slate-100 text-slate-600 border-slate-200",
};

const dotColors: Record<string, string> = {
  active: "bg-emerald-500",
  "in-progress": "bg-indigo-500",
  "at-risk": "bg-rose-500",
  critical: "bg-rose-500",
  blocked: "bg-rose-500",
  "need-client": "bg-amber-500",
  pending: "bg-amber-500",
  open: "bg-rose-500",
  healthy: "bg-emerald-500",
  good: "bg-emerald-500",
  resolved: "bg-emerald-500",
  approved: "bg-emerald-500",
};

function toVariant(status: string): string {
  return status
    .toLowerCase()
    .replace(/ /g, "-")
    .replace("waiting on client", "waiting-client")
    .replace("waiting on internal review", "waiting-internal")
    .replace("need client action", "need-client")
    .replace("not working", "not-working")
    .replace("changes requested", "changes-requested");
}

interface StatusBadgeProps {
  status: string;
  showDot?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({ status, showDot = false, size = "sm", className }: StatusBadgeProps) {
  const variant = toVariant(status) as Variant;
  const style = variantStyles[variant] || variantStyles.default;
  const dotColor = dotColors[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border rounded-full",
        size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1",
        style,
        className
      )}
    >
      {showDot && dotColor && (
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dotColor)} />
      )}
      {status}
    </span>
  );
}
