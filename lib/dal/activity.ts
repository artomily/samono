import { createClient } from "@/lib/supabase/server";
import type { ActivityStreamExternalEvent } from "@/components/ActivityStream";

interface SessionRow {
  id: string;
  ended_at: string | null;
  active_watch_seconds: number;
  videos: { title: string; reward_amount: number } | null;
}

interface RewardRow {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  tx_signature: string | null;
}

/**
 * Fetch the user's real recent activity (completed watch sessions + rewards),
 * merged and sorted descending by time.
 * Used to replace auto-generated fake events in the dashboard ActivityStream.
 */
export async function getRecentActivityEvents(
  userId: string
): Promise<ActivityStreamExternalEvent[]> {
  const supabase = await createClient();

  const [sessionsResult, rewardsResult] = await Promise.all([
    supabase
      .from("watch_sessions")
      .select("id, ended_at, active_watch_seconds, videos(title, reward_amount)")
      .eq("user_id", userId)
      .eq("status", "completed")
      .not("ended_at", "is", null)
      .order("ended_at", { ascending: false })
      .limit(8),
    supabase
      .from("rewards")
      .select("id, amount, status, created_at, tx_signature")
      .eq("user_id", userId)
      .in("status", ["completed", "processing"])
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const events: ActivityStreamExternalEvent[] = [];

  for (const session of (sessionsResult.data ?? []) as unknown as SessionRow[]) {
    const video = session.videos;
    const title = video?.title ?? "Unknown video";
    const mins = Math.round((session.active_watch_seconds ?? 0) / 60);
    const truncated = title.length > 34 ? title.slice(0, 34) + "…" : title;
    events.push({
      kind: "stream",
      message: `Watched "${truncated}" · ${mins} min`,
      ts: session.ended_at ? new Date(session.ended_at).getTime() : undefined,
    });
  }

  for (const reward of (rewardsResult.data ?? []) as unknown as RewardRow[]) {
    const label = reward.status === "completed" ? "Claimed" : "Pending";
    const sig = reward.tx_signature ? ` · sig ${reward.tx_signature.slice(0, 8)}` : "";
    events.push({
      kind: "reward",
      message: `${label} · ${reward.amount} SOL${sig}`,
      ts: new Date(reward.created_at).getTime(),
    });
  }

  events.sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
  return events.slice(0, 10);
}
