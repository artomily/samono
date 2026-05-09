import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { upsertVideos } from "@/lib/dal/videos";

const adminVideoSchema = z.object({
  secret: z.string(),
  youtubeVideoId: z.string().min(5).max(20),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  durationSeconds: z.number().int().min(1),
  rewardAmount: z.number().positive().default(10),
  minWatchPercentage: z.number().min(0.1).max(1).default(0.7),
});

export async function POST(req: NextRequest) {
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

  const parsed = adminVideoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
  }

  if (parsed.data.secret !== adminSecret) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await upsertVideos([
      {
        youtube_video_id: parsed.data.youtubeVideoId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        thumbnail_url: parsed.data.thumbnailUrl ?? `https://img.youtube.com/vi/${parsed.data.youtubeVideoId}/maxresdefault.jpg`,
        duration_seconds: parsed.data.durationSeconds,
        reward_amount: parsed.data.rewardAmount,
        min_watch_percentage: parsed.data.minWatchPercentage,
        is_active: true,
        published_at: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({ success: true, data: { created: result.count } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add video";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
