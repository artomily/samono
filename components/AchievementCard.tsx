import { cn } from "@/lib/utils";
import type { AchievementWithStatus } from "@/types/database";

interface AchievementCardProps {
  achievement: AchievementWithStatus;
  className?: string;
}

export function AchievementCard({ achievement, className }: AchievementCardProps) {
  const unlocked = achievement.unlocked_at !== null;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-opacity",
        !unlocked && "opacity-40",
        className
      )}
    >
      <span className="text-3xl" role="img" aria-label={achievement.name}>
        {achievement.icon}
      </span>
      {!unlocked && (
        <span
          className="absolute right-2 top-2 text-sm text-muted-foreground"
          aria-hidden="true"
        >
          🔒
        </span>
      )}
      <div className="space-y-0.5">
        <p className="text-sm font-semibold leading-none">{achievement.name}</p>
        <p className="text-xs text-muted-foreground">{achievement.description}</p>
      </div>
      {unlocked && (
        <p className="text-xs font-medium text-primary">+{achievement.xp_reward} XP</p>
      )}
    </div>
  );
}
