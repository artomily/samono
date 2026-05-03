import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { Profile, ProfileUpdate, AchievementWithStatus } from "@/types/database";

export type PublicProfileData = {
  profile: Profile;
  videosWatched: number;
  achievements: AchievementWithStatus[];
};

export async function getProfileById(userId: string): Promise<Profile | null> {
  return getProfile(userId);
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return data ?? null;
}

export async function updateProfile(
  userId: string,
  update: ProfileUpdate
): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", userId)
    .select()
    .single();

  return data ?? null;
}

export async function saveWalletAddress(
  userId: string,
  walletAddress: string
): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("profiles")
    .update({ wallet_address: walletAddress })
    .eq("id", userId);
}

export async function getUserWatchStats(userId: string): Promise<{
  videosWatched: number;
  totalEarned: number;
  streakCount: number;
}> {
  const supabase = await createClient();

  const [profileResult, sessionsResult] = await Promise.all([
    supabase.from("profiles").select("total_earned, streak_count").eq("id", userId).single(),
    supabase
      .from("watch_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed"),
  ]);

  return {
    totalEarned: profileResult.data?.total_earned ?? 0,
    streakCount: profileResult.data?.streak_count ?? 0,
    videosWatched: sessionsResult.count ?? 0,
  };
}

/** Returns the list of users referred by this user + total bonus earned from referrals. */
export async function getReferralStats(userId: string): Promise<{
  referralCode: string | null;
  totalReferrals: number;
  referralEarnings: number;
  referredUsers: Array<{ id: string; username: string | null; wallet_address: string | null; created_at: string }>;
}> {
  const supabase = await createClient();

  const [profileResult, referredResult, earningsResult] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", userId).single(),
    supabase
      .from("profiles")
      .select("id, username, wallet_address, created_at")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("rewards")
      .select("amount")
      .eq("user_id", userId)
      .eq("status", "completed"),
  ]);

  const referredUsers = referredResult.data ?? [];
  // Referral earnings = 10% of total completed rewards (as a placeholder heuristic).
  // Replace with a dedicated referral_rewards table for precision.
  const totalEarned = (earningsResult.data ?? []).reduce((s, r) => s + r.amount, 0);
  const referralEarnings = Math.round(totalEarned * 0.1 * 100) / 100;

  return {
    referralCode: profileResult.data?.username ?? null,
    totalReferrals: referredUsers.length,
    referralEarnings,
    referredUsers,
  };
}

/** Returns public profile data (profile + stats + all achievements with unlock status). */
export async function getProfileByUsername(
  username: string
): Promise<PublicProfileData | null> {
  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) return null;

  const [sessionsResult, achievementsResult, userAchievementsResult] =
    await Promise.all([
      supabase
        .from("watch_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("status", "completed"),
      supabase.from("achievements").select("*").order("xp_reward"),
      supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", profile.id),
    ]);

  const unlockedMap = new Map(
    (userAchievementsResult.data ?? []).map((ua) => [
      ua.achievement_id,
      ua.unlocked_at,
    ])
  );

  const achievements: AchievementWithStatus[] = (
    achievementsResult.data ?? []
  ).map((a) => ({
    ...a,
    unlocked_at: unlockedMap.get(a.id) ?? null,
  }));

  return {
    profile: profile as Profile,
    videosWatched: sessionsResult.count ?? 0,
    achievements,
  };
}
