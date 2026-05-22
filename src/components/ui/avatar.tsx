import { cn } from "@/lib/utils";

const PALETTE = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#0ea5e9", "#84cc16"];
function autoColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

interface AvatarProps {
  name: string;
  initials: string;
  color?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

export function Avatar({ name, initials, color, size = "md", className }: AvatarProps) {
  const bg = color ?? autoColor(name);
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold text-white flex-shrink-0",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: bg }}
      title={name}
    >
      {initials}
    </div>
  );
}

interface AvatarGroupProps {
  people: Array<{ name: string; initials: string; color: string }>;
  max?: number;
  size?: "xs" | "sm" | "md";
}

export function AvatarGroup({ people, max = 3, size = "sm" }: AvatarGroupProps) {
  const shown = people.slice(0, max);
  const rest = people.length - max;
  const sizeMap = { xs: "w-6 h-6 text-[10px]", sm: "w-7 h-7 text-xs", md: "w-8 h-8 text-xs" };

  return (
    <div className="flex -space-x-2">
      {shown.map((p, i) => (
        <div
          key={i}
          className={cn(
            "rounded-full flex items-center justify-center font-bold text-white border-2 border-white",
            sizeMap[size]
          )}
          style={{ backgroundColor: p.color }}
          title={p.name}
        >
          {p.initials}
        </div>
      ))}
      {rest > 0 && (
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-bold text-slate-600 bg-slate-100 border-2 border-white",
            sizeMap[size]
          )}
        >
          +{rest}
        </div>
      )}
    </div>
  );
}
