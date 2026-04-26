import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getPendingRewards, getRewardHistory, getClaimableAmount } from "@/lib/dal/rewards";
import { getSOLBalance } from "@/lib/solana/token";
import { getProfileById } from "@/lib/dal/profiles";

export async function GET(_req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const [profile, pending, history] = await Promise.all([
    getProfileById(user.id),
    getPendingRewards(user.id),
    getRewardHistory(user.id),
  ]);

  const claimableAmount = pending.reduce((sum, r) => sum + r.amount, 0);

  // Fetch on-chain balance if wallet connected
  let onChainBalance: number | null = null;
  if (profile?.wallet_address) {
    const balance = await getSOLBalance(profile.wallet_address);
    onChainBalance = balance?.uiAmount ?? null;
  }

  return NextResponse.json({
    success: true,
    data: {
      claimableAmount,
      pendingCount: pending.length,
      pendingRewards: pending,
      history: history.slice(0, 20),
      totalEarned: profile?.total_earned ?? 0,
      onChainBalance,
      walletAddress: profile?.wallet_address ?? null,
    },
  });
}
