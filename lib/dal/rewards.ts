import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { Reward, RewardInsert } from "@/types/database";

/** Get all pending rewards for a user (ready to claim) */
export async function getPendingRewards(userId: string): Promise<Reward[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Get total claimable amount for a user */
export async function getClaimableAmount(userId: string): Promise<number> {
  const pending = await getPendingRewards(userId);
  return pending.reduce((sum, r) => sum + r.amount, 0);
}

/** Get all rewards for a user (history) */
export async function getRewardHistory(userId: string): Promise<Reward[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rewards")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
}

/** Create a pending reward (service role — called after session validation) */
export async function createReward(reward: RewardInsert): Promise<Reward> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("rewards")
    .insert(reward)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Mark rewards as processing (prevents double-claim race) */
export async function markRewardsProcessing(rewardIds: string[]): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("rewards")
    .update({ status: "processing" })
    .in("id", rewardIds)
    .eq("status", "pending");
}

/** Mark a single reward as completed with tx signature */
export async function markRewardCompleted(
  rewardId: string,
  txSignature: string,
  walletAddress: string
): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("rewards")
    .update({
      status: "completed",
      tx_signature: txSignature,
      wallet_address: walletAddress,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", rewardId);
}

/** Mark a reward as failed with error message */
export async function markRewardFailed(
  rewardId: string,
  errorMessage: string
): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("rewards")
    .update({
      status: "failed",
      error_message: errorMessage,
      retry_count: supabase.rpc("increment_retry" as never, { reward_id: rewardId }) as any,
    })
    .eq("id", rewardId);
}

/** Reset failed rewards back to pending (for retry) */
export async function resetFailedReward(rewardId: string, userId: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("rewards")
    .update({ status: "pending", error_message: null })
    .eq("id", rewardId)
    .eq("user_id", userId)
    .eq("status", "failed")
    .lt("retry_count", 3);
}

/** Total SOL earned by user (completed rewards) */
export async function getTotalEarned(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("total_earned")
    .eq("id", userId)
    .single();

  return data?.total_earned ?? 0;
}
