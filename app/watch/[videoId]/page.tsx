export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { getVideoById } from "@/lib/dal/videos";
import { VideoPlayer } from "./VideoPlayer";
import { Badge } from "@/components/ui/badge";
import { Star, Clock } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface Props {
  params: Promise<{ videoId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { videoId } = await params;
  const video = await getVideoById(videoId).catch(() => null);
  return {
    title: video?.title ?? "Watch Video",
  };
}

export default async function WatchVideoPage({ params }: Props) {
  const { videoId } = await params;
  const user = await requireAuth();
  const video = await getVideoById(videoId).catch(() => null);

  if (!video || !video.is_active) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Player */}
      <VideoPlayer
        videoId={video.id}
        youtubeId={video.youtube_video_id}
        userId={user.id}
        durationSeconds={video.duration_seconds}
        rewardAmount={video.reward_amount}
      />

      {/* Video info */}
      <div className="space-y-3">
        <h1 className="text-xl font-bold leading-snug">{video.title}</h1>

        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="gap-1 text-primary border-primary/30 bg-primary/5">
            <Star className="h-3.5 w-3.5" />
            {Math.round(video.reward_amount * 5)} pts reward
          </Badge>
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(video.duration_seconds)}
          </Badge>
        </div>

        {video.description && (
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-4">
            {video.description}
          </p>
        )}
      </div>
    </div>
  );
}
