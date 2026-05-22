import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: string; positive?: boolean };
  gradient?: boolean;
  gradientClass?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-indigo-600",
  iconBg = "bg-indigo-50",
  trend,
  gradient,
  gradientClass = "gradient-indigo",
  className,
}: MetricCardProps) {
  if (gradient) {
    return (
      <div
        className={cn(
          "rounded-2xl p-5 text-white card-hover",
          gradientClass,
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/70">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-white/60 mt-1">{subtitle}</p>}
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        {trend && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <span className="text-xs text-white/70">{trend.value}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-200 p-5 card-hover",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <span className={cn("text-xs font-medium", trend.positive ? "text-emerald-600" : "text-rose-600")}>
            {trend.value}
          </span>
        </div>
      )}
    </div>
  );
}
