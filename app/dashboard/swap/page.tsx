import { SwapPointsClient } from "@/components/SwapPointsClient";
import { requireAuth } from "@/lib/auth/session";
import { getProfile } from "@/lib/dal/profiles";

export default async function DashboardSwapPage() {
  const user = await requireAuth();
  const profile = await getProfile(user.id);
  const username = profile?.username ?? user.email?.split("@")[0] ?? "operator";

  return (
    <SwapPointsClient
      username={username}
      initialPointsBalance={profile?.xp ?? 0}
      initialSolBalance={0}
    />
  );
}
