import { createClient } from "@/lib/supabase/server";
import type { LeaderboardEntry } from "@/types/database";
import { DUMMY_MODE, DUMMY_LEADERBOARD } from "@/lib/dummy";

export async function getTopEarners(limit = 50): Promise<LeaderboardEntry[]> {
  if (DUMMY_MODE) return DUMMY_LEADERBOARD.slice(0, limit) as unknown as LeaderboardEntry[];
  const supabase = await createClient();
  const { data } = await supabase
    .from("leaderboard")
    .select("*")
    .order("total_earned", { ascending: false })
    .limit(limit);

  return (data ?? []) as LeaderboardEntry[];
}

export async function getUserRank(userId: string): Promise<number | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leaderboard")
    .select("id, rank")
    .eq("id", userId)
    .single();

  return (data as LeaderboardEntry | null)?.rank ?? null;
}
