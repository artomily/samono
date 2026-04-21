import { Metadata } from "next";
import { requireAuth } from "@/lib/auth/session";
import { getVideos } from "@/lib/dal/videos";
import { VideoCard } from "@/components/VideoCard";
import { PlayCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Watch Videos",
};

export default async function WatchIndexPage() {
  await requireAuth();
  const videos = await getVideos();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <PlayCircle className="h-6 w-6 text-primary" />
          All Videos
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Watch videos to completion to earn SMT tokens
        </p>
      </div>

      {videos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/50 py-20 text-center text-muted-foreground">
          <PlayCircle className="mx-auto h-12 w-12 mb-4 opacity-30" />
          <p className="font-medium text-lg">No videos yet</p>
          <p className="text-sm mt-1">Videos will appear here once synced from YouTube</p>
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
  );
}
