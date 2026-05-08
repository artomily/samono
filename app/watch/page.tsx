export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { requireAuth } from "@/lib/auth/session";
import { getVideos } from "@/lib/dal/videos";
import { VideoCard } from "@/components/VideoCard";

export const metadata: Metadata = {
  title: "Watch Videos",
};

export default async function WatchIndexPage() {
  await requireAuth();
  const videos = await getVideos();

  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 lg:px-8 pb-16 pt-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 border-b border-white/8 pb-6">
          <div className="text-[10px] uppercase tracking-[0.4em] text-cyan-300/60 mb-2">
            streams
          </div>
          <h1 className="font-mono text-3xl sm:text-4xl uppercase tracking-[0.12em] text-white">
            Watch &amp; Earn
          </h1>
          <p className="mt-2 text-sm leading-6 text-white/55">
            Watch videos to completion and earn SOL rewards directly to your wallet
          </p>
        </div>

        {videos.length === 0 ? (
          <div className="border border-white/10 py-20 text-center">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-3">
              no streams available
            </div>
            <p className="text-sm text-white/25">Videos will appear here once synced from YouTube</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((video) => (
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
