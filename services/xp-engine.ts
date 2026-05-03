import { createServiceClient } from "@/lib/supabase/server";

// ─── XP constants ────────────────────────────────────────────────────────────

export const WATCH_XP_PER_MINUTE = 1;   // 1 XP per minute of active watch time
export const FINISH_VIDEO_XP    = 10;  // Bonus for completing a video (~10 videos → 700 pts)
export const STREAK_BONUS_XP    = 200; // Daily streak bonus

// ─── Level formula ───────────────────────────────────────────────────────────

/**
 * Derive level from total XP.
 * Level N requires N² × 100 XP to reach.
 *   0 XP  → Level 0
 *   100   → Level 1
 *   400   → Level 2
 *   900   → Level 3
 */
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

/** XP required to *reach* a given level. */
export function xpForLevel(level: number): number {
  return level * level * 100;
}

/**
 * Break down a user's raw XP into progress within the current level.
 * Useful for rendering the XP progress bar.
 */
export function xpBreakdown(xp: number): {
  level: number;
  currentLevelXp: number;   // XP at start of this level
  nextLevelXp: number;      // XP needed to reach next level
  progressXp: number;       // XP earned within current level
  neededXp: number;         // XP remaining to next level
  progress: number;         // 0..1 fraction
} {
  const level = calculateLevel(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp    = xpForLevel(level + 1);
  const progressXp     = xp - currentLevelXp;
  const neededXp       = nextLevelXp - currentLevelXp;
  return {
    level,
    currentLevelXp,
    nextLevelXp,
    progressXp,
    neededXp,
    progress: neededXp > 0 ? progressXp / neededXp : 1,
  };
}

// ─── Level tiers ─────────────────────────────────────────────────────────────

export type LevelTier = {
  name: string;
  color: string;        // Tailwind text-* class
  bg: string;           // Tailwind bg-* class
  border: string;       // Tailwind border-* class
  minLevel: number;
};

export const LEVEL_TIERS: LevelTier[] = [
  { name: "Rookie",   color: "text-zinc-400",    bg: "bg-zinc-400/10",   border: "border-zinc-400/30",  minLevel: 0  },
  { name: "Explorer", color: "text-blue-400",    bg: "bg-blue-400/10",   border: "border-blue-400/30",  minLevel: 3  },
  { name: "Veteran",  color: "text-violet-400",  bg: "bg-violet-400/10", border: "border-violet-400/30",minLevel: 6  },
  { name: "Champion", color: "text-orange-400",  bg: "bg-orange-400/10", border: "border-orange-400/30",minLevel: 10 },
  { name: "Legend",   color: "text-primary",     bg: "bg-primary/10",    border: "border-primary/30",   minLevel: 15 },
];

export function getTier(level: number): LevelTier {
  return (
    [...LEVEL_TIERS].reverse().find((t) => level >= t.minLevel) ?? LEVEL_TIERS[0]
  );
}

// ─── Award XP ────────────────────────────────────────────────────────────────

export async function awardXP(
  userId: string,
  amount: number
): Promise<{ newXp: number; newLevel: number; leveledUp: boolean }> {
  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, level")
    .eq("id", userId)
    .single();

  const oldLevel = profile?.level ?? 0;
  const newXp    = (profile?.xp ?? 0) + amount;
  const newLevel = calculateLevel(newXp);

  await supabase
    .from("profiles")
    .update({ xp: newXp, level: newLevel, updated_at: new Date().toISOString() })
    .eq("id", userId);

  return { newXp, newLevel, leveledUp: newLevel > oldLevel };
}
