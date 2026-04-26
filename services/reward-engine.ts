import { transferSOL } from "@/lib/solana/token";
import {
  getPendingRewards,
  markRewardsProcessing,
  markRewardCompleted,
  markRewardFailed,
  createReward,
} from "@/lib/dal/rewards";
import { getProfileById, saveWalletAddress } from "@/lib/dal/profiles";
import { createServiceClient } from "@/lib/supabase/server";
import type { Video, Profile, Reward } from "@/types/database";

const MAX_STREAK_MULTIPLIER  = 2.0;
const STREAK_BONUS_PER_DAY   = 0.05; // +5% per streak day
const LEVEL_BONUS_PER_LEVEL  = 0.05; // +5% per level
const REFERRAL_BONUS         = 0.10; // +10% for having a referrer

/**
 * Calculate the SOL reward for a completed session.
 * Applies streak multiplier, level bonus, and referral bonus.
 */
export function calculateReward(video: Video, profile: Profile): number {
  let amount = video.reward_amount;

  // Streak multiplier: 1.0 base to 2.0 max
  const streakMultiplier = Math.min(
    MAX_STREAK_MULTIPLIER,
    1 + profile.streak_count * STREAK_BONUS_PER_DAY
  );
  amount *= streakMultiplier;

  // Level bonus: +5% per level (no cap — levels scale naturally)
  const levelBonus = profile.level * LEVEL_BONUS_PER_LEVEL;
  amount *= 1 + levelBonus;

  // Referral bonus for users who were referred
  if (profile.referrer_id) {
    amount *= 1 + REFERRAL_BONUS;
  }

  // Round to 4 decimal places
  return Math.round(amount * 10000) / 10000;
}

/**
 * Bonus for the referrer when their referred user earns.
 * Called alongside createPendingReward if profile has referrer.
 */
export async function creditReferralBonus(
  referrerId: string,
  watchSessionId: string,
  baseAmount: number
): Promise<void> {
  try {
    const referrerBonus = Math.round(baseAmount * REFERRAL_BONUS * 10000) / 10000;
    if (referrerBonus <= 0) return;

    // Create a separate reward row for the referrer
    // We use a synthetic session reference via a unique key
    const supabase = createServiceClient();

    // Check if referral bonus already given for this session
    const { data: existing } = await supabase
      .from("rewards")
      .select("id")
      .eq("watch_session_id", watchSessionId)
      .eq("user_id", referrerId)
      .single();

    if (!existing) {
      await supabase.from("rewards").insert({
        user_id: referrerId,
        watch_session_id: watchSessionId,
        amount: referrerBonus,
        status: "pending",
        wallet_address: null,
        tx_signature: null,
        error_message: null,
        claimed_at: null,
      });
    }
  } catch {
    // Non-critical — don't fail main reward flow
  }
}

/**
 * Create a pending reward after session validation.
 */
export async function createPendingReward(
  userId: string,
  watchSessionId: string,
  amount: number
): Promise<Reward> {
  // Mark session as rewarded first (idempotency)
  const supabase = createServiceClient();
  await supabase
    .from("watch_sessions")
    .update({ is_rewarded: true })
    .eq("id", watchSessionId)
    .eq("user_id", userId);

  const reward = await createReward({
    user_id: userId,
    watch_session_id: watchSessionId,
    amount,
    status: "pending",
    wallet_address: null,
    tx_signature: null,
    error_message: null,
    claimed_at: null,
  });

  return reward;
}

/**
 * Process manual claim for a user.
 * Transfers all pending SOL to the provided wallet address.
 * Returns array of results.
 */
export async function processClaimRequest(
  userId: string,
  walletAddress: string
): Promise<{ claimed: number; total: number; signatures: string[] }> {
  const pending = await getPendingRewards(userId);
  if (pending.length === 0) {
    return { claimed: 0, total: 0, signatures: [] };
  }

  const ids = pending.map((r) => r.id);

  // Mark all as processing to prevent race conditions
  await markRewardsProcessing(ids);

  // Save wallet address to profile
  await saveWalletAddress(userId, walletAddress);

  let totalClaimed = 0;
  const signatures: string[] = [];

  // Transfer each reward individually (for granular retry + audit trail)
  for (const reward of pending) {
    const result = await transferSOL(walletAddress, reward.amount);

    if (result.success && result.signature) {
      await markRewardCompleted(reward.id, result.signature, walletAddress);
      totalClaimed += reward.amount;
      signatures.push(result.signature);
    } else {
      await markRewardFailed(reward.id, result.error ?? "Transfer failed");
    }
  }

  return {
    claimed: totalClaimed,
    total: pending.reduce((sum, r) => sum + r.amount, 0),
    signatures,
  };
}
