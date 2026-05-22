import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "xs" | "sm" | "md";
  colorClass?: string;
  showLabel?: boolean;
  className?: string;
}

function getColorClass(value: number) {
  if (value >= 80) return "bg-emerald-500";
  if (value >= 50) return "bg-indigo-500";
  if (value >= 25) return "bg-amber-500";
  return "bg-rose-500";
}

export function ProgressBar({
  value,
  max = 100,
  size = "sm",
  colorClass,
  showLabel = false,
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, (value / max) * 100);
  const color = colorClass || getColorClass(pct);
  const heights = { xs: "h-1", sm: "h-1.5", md: "h-2.5" };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("flex-1 rounded-full bg-slate-100 overflow-hidden", heights[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-slate-600 w-8 text-right">{Math.round(pct)}%</span>
      )}
    </div>
  );
}
