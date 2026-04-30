import { batchSyncYouTubeVideos, type YouTubeSyncConfig } from "@/lib/youtube/batch";
import { NextRequest, NextResponse } from "next/server";

// Define your YouTube sources here
const YOUTUBE_SOURCES: YouTubeSyncConfig[] = [
  {
    name: "Main Channel",
    source: "channel",
    id: process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID || "UCd_2mFYfC0V4tPjI2EKCxKw",
    maxResults: 50,
    rewardAmount: 15,
    minWatchPercentage: 0.75,
  },
  {
    name: "Playlist",
    source: "playlist",
    id: process.env.YOUTUBE_PLAYLIST_ID || "PLNuFaSVDSOyoaQI9rn0D1c0Nab280dnDc",
    maxResults: 30,
    rewardAmount: 10,
    minWatchPercentage: 0.7,
  },
];

export async function GET(req: NextRequest) {
  // Verify the request is from Vercel (or your scheduler)
  // This is optional but recommended for security
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("Starting scheduled YouTube sync...");

    const results = await batchSyncYouTubeVideos(YOUTUBE_SOURCES, 1000);

    const summary = {
      timestamp: new Date().toISOString(),
      totalSources: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      totalVideosAdded: results.reduce((sum, r) => sum + r.videosAdded, 0),
      details: results.map((r) => ({
        name: r.configName,
        success: r.success,
        videos: r.videosAdded,
        message: r.message,
      })),
    };

    console.log("Sync complete:", summary);

    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    console.error("Cron sync failed:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        error: "Cron job failed",
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
