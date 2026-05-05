import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  username: string;
  wallet_address: string | null;
  total_earned: number;
  xp: number;
  watch_streak: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  currentUserRank?: number | null;
}

const RANK_ICONS: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export function LeaderboardTable({
  entries,
  currentUserRank,
}: LeaderboardTableProps) {
  return (
    <div className="border border-white/10 overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[3.5rem_1fr_4rem_5rem_5rem] gap-2 px-4 py-3 bg-white/4 border-b border-white/10">
        <span className="text-[10px] uppercase tracking-[0.28em] text-white/35">rank</span>
        <span className="text-[10px] uppercase tracking-[0.28em] text-white/35">user</span>
        <span className="text-[10px] uppercase tracking-[0.28em] text-white/35 text-right hidden sm:block">streak</span>
        <span className="text-[10px] uppercase tracking-[0.28em] text-white/35 text-right">xp</span>
        <span className="text-[10px] uppercase tracking-[0.28em] text-white/35 text-right">sol</span>
      </div>

      {/* Rows */}
      <div>
        {entries.map((entry, idx) => {
          const isTop3 = entry.rank <= 3;
          const rankColor =
            entry.rank === 1
              ? "text-amber-300"
              : entry.rank === 2
                ? "text-white/70"
                : entry.rank === 3
                  ? "text-orange-400/80"
                  : "text-white/40";

          return (
            <div
              key={entry.rank}
              className={cn(
                "grid grid-cols-[3.5rem_1fr_4rem_5rem_5rem] gap-2 px-4 py-3 items-center border-b border-white/5 last:border-0",
                "hover:bg-white/4 transition-colors duration-100",
                idx % 2 === 0 ? "" : "bg-white/1.5"
              )}
            >
              {/* Rank */}
              <span className={cn("font-mono text-sm font-bold", rankColor)}>
                {isTop3 ? RANK_ICONS[entry.rank] : `#${entry.rank}`}
              </span>

              {/* User */}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-mono uppercase tracking-wider text-white/90 truncate">
                  {entry.username}
                </span>
                {entry.wallet_address && (
                  <span className="text-[11px] font-mono text-white/30 truncate">
                    {entry.wallet_address.slice(0, 6)}…{entry.wallet_address.slice(-4)}
                  </span>
                )}
              </div>

              {/* Streak */}
              <span className="hidden sm:block text-right font-mono text-sm text-amber-400/80">
                🔥 {entry.watch_streak}
              </span>

              {/* XP */}
              <span className="text-right font-mono text-sm text-cyan-300 whitespace-nowrap">
                {entry.xp.toLocaleString()}
              </span>

              {/* SOL earned */}
              <span className="text-right font-mono text-sm text-emerald-300 whitespace-nowrap">
                {entry.total_earned.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current user rank footer */}
      {currentUserRank && currentUserRank > (entries[entries.length - 1]?.rank ?? 0) && (
        <div className="px-4 py-3 border-t border-white/10 bg-cyan-300/4 text-center">
          <span className="text-[11px] uppercase tracking-[0.26em] text-white/40">
            your rank:{" "}
          </span>
          <span className="font-mono text-sm font-bold text-cyan-300">
            #{currentUserRank}
          </span>
        </div>
      )}
    </div>
  );
}
