import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchChannelVideos, fetchPlaylistVideos } from "@/lib/youtube/client";
import { upsertVideos } from "@/lib/dal/videos";

const bodySchema = z.object({
  secret: z.string(),
  source: z.enum(["channel", "playlist"]).default("channel"),
  maxResults: z.number().int().min(1).max(50).default(50),
});

export async function POST(req: NextRequest) {
  // Verify admin secret
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ success: false, error: "Admin secret not configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
  }

  if (parsed.data.secret !== adminSecret) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    let videos;
    if (parsed.data.source === "playlist") {
      const playlistId = process.env.YOUTUBE_PLAYLIST_ID;
      if (!playlistId) {
        return NextResponse.json({ success: false, error: "YOUTUBE_PLAYLIST_ID not set" }, { status: 500 });
      }
      videos = await fetchPlaylistVideos(playlistId, parsed.data.maxResults);
    } else {
      const channelId = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;
      if (!channelId) {
        return NextResponse.json({ success: false, error: "NEXT_PUBLIC_YOUTUBE_CHANNEL_ID not set" }, { status: 500 });
      }
      videos = await fetchChannelVideos(channelId, parsed.data.maxResults);
    }

    const result = await upsertVideos(videos);
    return NextResponse.json({ success: true, data: { synced: result.count } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
