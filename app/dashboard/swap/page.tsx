import { SwapPointsClient } from "@/components/SwapPointsClient";
import { requireAuth } from "@/lib/auth/session";
import { getProfile } from "@/lib/dal/profiles";
import { getSOLBalance } from "@/lib/solana/token";

export default async function DashboardSwapPage() {
  const user = await requireAuth();
  const profile = await getProfile(user.id);
  const username = profile?.username ?? user.email?.split("@")[0] ?? "operator";

  let initialSolBalance = 0;
  if (profile?.wallet_address) {
    const balance = await getSOLBalance(profile.wallet_address).catch(() => null);
    initialSolBalance = balance?.uiAmount ?? 0;
  }

  return (
    <SwapPointsClient
      username={username}
      initialPointsBalance={profile?.xp ?? 0}
      initialSolBalance={initialSolBalance}
    />
  );
}
