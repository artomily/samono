import { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import { getProfile, getUserWatchStats } from "@/lib/dal/profiles";
import { getClaimableAmount } from "@/lib/dal/rewards";
import { getVideos } from "@/lib/dal/videos";
import { getRecentActivityEvents } from "@/lib/dal/activity";
import { DashboardClient } from "@/components/DashboardClient";
import { LoginOverlay } from "@/components/LoginOverlay";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await getSession();

  if (!user) {
    return <LoginOverlay />;
  }

  const [profile, stats, pendingAmount, videos, recentActivity] = await Promise.all([
    getProfile(user.id),
    getUserWatchStats(user.id),
    getClaimableAmount(user.id),
    getVideos(),
    getRecentActivityEvents(user.id),
  ]);

  const username = profile?.username ?? user.email?.split("@")[0] ?? "User";

  return (
    <DashboardClient
      username={username}
      userPoints={profile?.xp ?? 0}
      totalEarned={profile?.total_earned ?? 0}
      pendingAmount={pendingAmount}
      watchStreak={profile?.streak_count ?? 0}
      videosWatched={stats?.videosWatched ?? 0}
      referralUsername={profile?.username ?? undefined}
      recentActivity={recentActivity}
      videos={videos.map((video) => ({
        id: video.id,
        youtubeId: video.youtube_video_id,
        title: video.title,
        thumbnailUrl: video.thumbnail_url ?? "",
        durationSeconds: video.duration_seconds,
        viewCount: video.view_count,
        rewardAmount: video.reward_amount,
      }))}
    />
  );
}
