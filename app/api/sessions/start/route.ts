import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { createSession, getDailySessionCount } from "@/lib/dal/sessions";
import { getVideoById } from "@/lib/dal/videos";
import { MAX_DAILY_SESSIONS } from "@/services/session-validator";

const bodySchema = z.object({
  videoId: z.string().uuid("Invalid video ID"),
});

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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

  // Verify video exists
  const video = await getVideoById(parsed.data.videoId);
  if (!video) {
    return NextResponse.json({ success: false, error: "Video not found" }, { status: 404 });
  }

  // Rate limit: max sessions per day
  const dailyCount = await getDailySessionCount(user.id);
  if (dailyCount >= MAX_DAILY_SESSIONS) {
    return NextResponse.json(
      { success: false, error: "Daily session limit reached", code: "RATE_LIMITED" },
      { status: 429 }
    );
  }

  try {
    const session = await createSession(user.id, parsed.data.videoId);
    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        videoId: video.id,
        rewardAmount: video.reward_amount,
        minWatchPercentage: video.min_watch_percentage,
        durationSeconds: video.duration_seconds,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "ALREADY_COMPLETED") {
      return NextResponse.json(
        { success: false, error: "You have already earned rewards for this video", code: "ALREADY_COMPLETED" },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, error: "Failed to start session" }, { status: 500 });
  }
}
