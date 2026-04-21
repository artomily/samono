import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { Profile, ProfileUpdate } from "@/types/database";

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
