import { Metadata } from "next";
import { getTopEarners } from "@/lib/dal/leaderboard";
import { getUserRank } from "@/lib/dal/leaderboard";
import { getSession } from "@/lib/auth/session";
import { LeaderboardTable } from "@/components/LeaderboardTable";

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
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 lg:px-8 pb-16 pt-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-10 border-b border-white/8 pb-6">
          <div className="text-[10px] uppercase tracking-[0.4em] text-cyan-300/60 mb-2">
            rankings
          </div>
          <h1 className="font-mono text-3xl sm:text-4xl uppercase tracking-[0.12em] text-white">
            Leaderboard
          </h1>
          <p className="mt-2 text-sm leading-6 text-white/55">
            Top earners ranked by total SOL rewards
          </p>
        </div>

        {/* Podium */}
        {tableEntries.length >= 3 && (
          <div className="mb-8 border border-white/10 bg-white/3 p-6">
            <div className="text-[10px] uppercase tracking-[0.34em] text-white/40 mb-6">
              top performers
            </div>
            <div className="flex items-end justify-center gap-4">
              {/* 2nd place */}
              <div className="flex flex-col items-center gap-2">
                <div className="text-2xl">🥈</div>
                <div
                  className="border border-white/15 bg-white/5 px-4 py-3 text-center min-w-28 flex flex-col justify-center"
                  style={{ height: "5rem" }}
                >
                  <p className="text-[11px] font-mono uppercase tracking-wider truncate text-white/80">
                    {tableEntries[1].username}
                  </p>
                  <p className="text-[11px] text-cyan-300/70 mt-1 font-mono">
                    {tableEntries[1].total_earned.toFixed(2)} SOL
                  </p>
                </div>
              </div>
              {/* 1st place */}
              <div className="flex flex-col items-center gap-2">
                <div className="text-3xl">🥇</div>
                <div
                  className="border border-amber-400/40 bg-amber-400/8 px-4 py-3 text-center min-w-28 flex flex-col justify-center"
                  style={{ height: "6rem" }}
                >
                  <p className="text-[11px] font-mono uppercase tracking-wider truncate text-white">
                    {tableEntries[0].username}
                  </p>
                  <p className="text-[11px] text-amber-300 mt-1 font-mono">
                    {tableEntries[0].total_earned.toFixed(2)} SOL
                  </p>
                </div>
              </div>
              {/* 3rd place */}
              <div className="flex flex-col items-center gap-2">
                <div className="text-2xl">🥉</div>
                <div
                  className="border border-white/15 bg-white/5 px-4 py-3 text-center min-w-28 flex flex-col justify-center"
                  style={{ height: "4.5rem" }}
                >
                  <p className="text-[11px] font-mono uppercase tracking-wider truncate text-white/80">
                    {tableEntries[2].username}
                  </p>
                  <p className="text-[11px] text-cyan-300/70 mt-1 font-mono">
                    {tableEntries[2].total_earned.toFixed(2)} SOL
                  </p>
                </div>
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
          <div className="border border-white/10 py-20 text-center">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-3">
              no rankings yet
            </div>
            <p className="text-sm text-white/25">Be the first to earn SOL rewards!</p>
          </div>
        )}
      </div>
    </div>
  );
}
