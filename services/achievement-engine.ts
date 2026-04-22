import { createServiceClient } from "@/lib/supabase/server";
import { DUMMY_MODE } from "@/lib/dummy";
import type { Achievement, AchievementCondition } from "@/types/database";

// ─── Condition evaluator ─────────────────────────────────────────────────────

function evaluateCondition(
  raw: Achievement["condition_json"],
  ctx: AchievementContext
): boolean {
  const condition = raw as AchievementCondition;
  switch (condition.type) {
    case "videos_watched":  return ctx.videosWatched  >= condition.threshold;
    case "streak_days":     return ctx.streakDays     >= condition.threshold;
    case "total_xp":        return ctx.totalXp        >= condition.threshold;
    case "watch_minutes":   return ctx.totalWatchMinutes >= condition.threshold;
    default: return false;
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type AchievementContext = {
  videosWatched: number;
  streakDays: number;
  totalXp: number;
  totalWatchMinutes: number;
};

// ─── evaluate ────────────────────────────────────────────────────────────────

/**
 * Evaluate all achievements for a user.
 * Fetches its own context from DB — call this after XP has been awarded.
 * Returns the list of newly-unlocked achievements (empty if DUMMY_MODE).
 */
export async function evaluateAchievements(userId: string): Promise<Achievement[]> {
  if (DUMMY_MODE) return [];

  const supabase = createServiceClient();

  const [
    { data: profileData },
    { data: allAchievements },
    { data: unlockedRows },
    sessionsResult,
    watchResult,
  ] = await Promise.all([
    supabase.from("profiles").select("xp, streak_count").eq("id", userId).single(),
    supabase.from("achievements").select("*"),
    supabase.from("user_achievements").select("achievement_id").eq("user_id", userId),
    supabase
      .from("watch_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed"),
    supabase
      .from("watch_sessions")
      .select("active_watch_seconds")
      .eq("user_id", userId)
      .eq("status", "completed"),
  ]);

  if (!allAchievements) return [];

  const unlockedIds = new Set((unlockedRows ?? []).map((u) => u.achievement_id));

  const totalWatchSeconds = (watchResult.data ?? []).reduce(
    (sum, s) => sum + s.active_watch_seconds,
    0
  );

  const ctx: AchievementContext = {
    videosWatched:    sessionsResult.count ?? 0,
    streakDays:       profileData?.streak_count ?? 0,
    totalXp:          profileData?.xp ?? 0,
    totalWatchMinutes: Math.floor(totalWatchSeconds / 60),
  };

  const newlyUnlocked: Achievement[] = [];

  for (const achievement of allAchievements) {
    if (unlockedIds.has(achievement.id)) continue;
    if (evaluateCondition(achievement.condition_json, ctx)) {
      newlyUnlocked.push(achievement);
    }
  }

  if (newlyUnlocked.length > 0) {
    await supabase.from("user_achievements").insert(
      newlyUnlocked.map((a) => ({
        user_id:        userId,
        achievement_id: a.id,
        unlocked_at:    new Date().toISOString(),
      }))
    );
  }

  return newlyUnlocked;
}
