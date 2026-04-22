import { Progress } from "@/components/ui/progress";
import { xpBreakdown } from "@/services/xp-engine";
import { cn } from "@/lib/utils";

interface XPProgressBarProps {
  xp: number;
  className?: string;
}

export function XPProgressBar({ xp, className }: XPProgressBarProps) {
  const { level, progressXp, neededXp, progress } = xpBreakdown(xp);
  const pct = Math.round(progress * 100);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Level {level} XP Progress</span>
        <span>
          {progressXp} / {neededXp} XP
        </span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}
