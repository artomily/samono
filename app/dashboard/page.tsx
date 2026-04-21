import { Metadata } from "next";
import { requireAuth } from "@/lib/auth/session";
import { getProfile, getUserWatchStats } from "@/lib/dal/profiles";
import { getClaimableAmount } from "@/lib/dal/rewards";
import { getVideos } from "@/lib/dal/videos";
import { StatsBar } from "@/components/StatsBar";
import { VideoCard } from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlayCircle, RefreshCw } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await requireAuth();

  const [profile, stats, pendingAmount, videos] = await Promise.all([
    getProfile(user.id),
    getUserWatchStats(user.id),
    getClaimableAmount(user.id),
    getVideos(),
  ]);

  const username = profile?.username ?? user.email?.split("@")[0] ?? "User";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {username} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Keep watching to grow your streak and earn more
          </p>
        </div>
        {pendingAmount > 0 && (
          <Button render={<Link href="/wallet" />} variant="default" size="sm">
            Claim {pendingAmount.toFixed(2)} SMT
          </Button>
        )}
      </div>

      {/* Stats */}
      <StatsBar
        totalEarned={profile?.total_earned ?? 0}
        pendingRewards={pendingAmount}
        watchStreak={profile?.streak_count ?? 0}
        videosWatched={stats?.videosWatched ?? 0}
      />

      {/* Referral banner */}
      {profile?.username && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Share your referral link</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Earn +10% bonus on every friend&apos;s rewards
            </p>
          </div>
          <code className="text-xs bg-muted rounded px-2 py-1 font-mono truncate max-w-xs">
            {process.env.NEXT_PUBLIC_APP_URL}/register?ref={profile.username}
          </code>
        </div>
      )}

      {/* Videos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            Videos
          </h2>
          <Button render={<Link href="/watch" />} variant="ghost" size="sm">
            View All <RefreshCw className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>

        {videos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/50 py-16 text-center text-muted-foreground">
            <PlayCircle className="mx-auto h-10 w-10 mb-3 opacity-40" />
            <p className="font-medium">No videos available yet</p>
            <p className="text-sm mt-1">Check back soon or ask an admin to sync from YouTube</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.slice(0, 8).map((video) => (
              <VideoCard
                key={video.id}
                id={video.id}
                youtubeId={video.youtube_video_id}
                title={video.title}
                thumbnailUrl={video.thumbnail_url ?? ""}
                durationSeconds={video.duration_seconds}
                viewCount={video.view_count}
                rewardAmount={video.reward_amount}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
