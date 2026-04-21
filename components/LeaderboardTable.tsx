import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Coins, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  username: string;
  wallet_address: string | null;
  total_earned: number;
  watch_streak: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  currentUserRank?: number | null;
}

const RANK_COLORS: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-zinc-300",
  3: "text-orange-400",
};

const RANK_ICONS: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export function LeaderboardTable({
  entries,
  currentUserId,
  currentUserRank,
}: LeaderboardTableProps) {
  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[3rem_1fr_auto_auto] gap-4 px-4 py-2.5 bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <span>Rank</span>
        <span>User</span>
        <span className="text-right hidden sm:block">Streak</span>
        <span className="text-right">Earned</span>
      </div>

      {/* Entries */}
      <div className="divide-y divide-border/30">
        {entries.map((entry) => {
          const isTop3 = entry.rank <= 3;
          const rankColor = RANK_COLORS[entry.rank] ?? "text-muted-foreground";

          return (
            <div
              key={entry.rank}
              className={cn(
                "grid grid-cols-[3rem_1fr_auto_auto] gap-4 px-4 py-3 items-center transition-colors",
                "hover:bg-muted/20"
              )}
            >
              {/* Rank */}
              <span className={cn("text-sm font-bold", rankColor)}>
                {isTop3 ? RANK_ICONS[entry.rank] : `#${entry.rank}`}
              </span>

              {/* User */}
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {entry.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{entry.username}</p>
                  {entry.wallet_address && (
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {entry.wallet_address.slice(0, 6)}…
                    </p>
                  )}
                </div>
              </div>

              {/* Streak */}
              <span className="hidden sm:flex items-center gap-1 text-sm text-orange-400 font-medium">
                🔥 {entry.watch_streak}
              </span>

              {/* Earned */}
              <span className="flex items-center justify-end gap-1 text-sm text-primary font-semibold whitespace-nowrap">
                <Coins className="h-3.5 w-3.5" />
                {entry.total_earned.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current user rank footer */}
      {currentUserRank && currentUserRank > (entries[entries.length - 1]?.rank ?? 0) && (
        <div className="px-4 py-3 bg-primary/5 border-t border-primary/20 text-sm text-center text-muted-foreground">
          Your rank: <span className="font-bold text-primary">#{currentUserRank}</span>
        </div>
      )}
    </div>
  );
}
