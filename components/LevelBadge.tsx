import { cn } from "@/lib/utils";
import { getTier } from "@/services/xp-engine";

interface LevelBadgeProps {
  level: number;
  className?: string;
}

export function LevelBadge({ level, className }: LevelBadgeProps) {
  const tier = getTier(level);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        tier.bg,
        tier.border,
        tier.color,
        className
      )}
    >
      Lvl {level} · {tier.name}
    </span>
  );
}
