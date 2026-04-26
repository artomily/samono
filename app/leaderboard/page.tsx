import { Metadata } from "next";
import { getTopEarners } from "@/lib/dal/leaderboard";
import { getUserRank } from "@/lib/dal/leaderboard";
import { getSession } from "@/lib/auth/session";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: "Leaderboard",
};

export default async function LeaderboardPage() {
  const [session, entries] = await Promise.all([
    getSession(),
    getTopEarners(50),
  ]);

  const userRank = session ? await getUserRank(session.id).catch(() => null) : null;

  const tableEntries = entries.map((e, i) => ({
    rank: e.rank ?? i + 1,
    username: e.username ?? `User ${i + 1}`,
    wallet_address: e.wallet_address,
    total_earned: e.total_earned,
    watch_streak: e.watch_streak,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-400" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground">
          Top earners on Samono, ranked by total SOL rewards earned
        </p>
      </div>

      {/* Podium */}
      {tableEntries.length >= 3 && (
        <div className="flex items-end justify-center gap-4 py-6">
          {/* 2nd */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-2xl">🥈</div>
            <div className="bg-zinc-500/20 rounded-lg px-4 py-3 text-center min-w-24" style={{ height: "5rem" }}>
              <p className="text-sm font-semibold truncate">{tableEntries[1].username}</p>
              <p className="text-xs text-muted-foreground">{tableEntries[1].total_earned.toFixed(1)} SOL</p>
            </div>
          </div>
          {/* 1st */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-3xl">🥇</div>
            <div className="bg-yellow-500/20 rounded-lg px-4 py-3 text-center border border-yellow-500/30 min-w-24" style={{ height: "6rem" }}>
              <p className="text-sm font-semibold truncate">{tableEntries[0].username}</p>
              <p className="text-xs text-yellow-400">{tableEntries[0].total_earned.toFixed(1)} SOL</p>
            </div>
          </div>
          {/* 3rd */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-2xl">🥉</div>
            <div className="bg-orange-500/20 rounded-lg px-4 py-3 text-center min-w-24" style={{ height: "4.5rem" }}>
              <p className="text-sm font-semibold truncate">{tableEntries[2].username}</p>
              <p className="text-xs text-muted-foreground">{tableEntries[2].total_earned.toFixed(1)} SOL</p>
            </div>
          </div>
        </div>
      )}

      {/* Full table */}
      <LeaderboardTable
        entries={tableEntries}
        currentUserId={session?.id}
        currentUserRank={userRank}
      />

      {tableEntries.length === 0 && (
        <div className="rounded-lg border border-dashed border-border/50 py-20 text-center text-muted-foreground">
          <Trophy className="mx-auto h-10 w-10 mb-3 opacity-30" />
          <p className="font-medium">No rankings yet</p>
          <p className="text-sm mt-1">Be the first to earn SOL rewards!</p>
        </div>
      )}
    </div>
  );
}
