import { Coins, PlayCircle, TrendingUp, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsBarProps {
  totalEarned: number;
  pendingRewards: number;
  watchStreak: number;
  videosWatched: number;
}

export function StatsBar({
  totalEarned,
  pendingRewards,
  watchStreak,
  videosWatched,
}: StatsBarProps) {
  const stats = [
    {
      label: "Total Earned",
      value: `${totalEarned.toFixed(2)} SMT`,
      icon: Coins,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Pending Rewards",
      value: `${pendingRewards.toFixed(2)} SMT`,
      icon: TrendingUp,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
    },
    {
      label: "Watch Streak",
      value: `${watchStreak} days`,
      icon: Flame,
      color: "text-red-400",
      bg: "bg-red-400/10",
    },
    {
      label: "Videos Watched",
      value: watchStreak.toString(),
      icon: PlayCircle,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
  ];

  // Fix: use actual videos watched, not streak
  stats[3].value = videosWatched.toString();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <Card key={label} className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`rounded-md p-1.5 ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-lg font-bold ${color}`}>{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
