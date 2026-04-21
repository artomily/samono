import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { completeSession, getSessionById } from "@/lib/dal/sessions";
import { getVideoById } from "@/lib/dal/videos";
import { getProfileById } from "@/lib/dal/profiles";
import { validateSession } from "@/services/session-validator";
import { calculateReward, createPendingReward, creditReferralBonus } from "@/services/reward-engine";

const bodySchema = z.object({
  activeWatchSeconds: z.number().int().min(0),
  totalElapsedSeconds: z.number().int().min(0),
  watchPercentage: z.number().min(0).max(1),
  tabSwitchCount: z.number().int().min(0),
  pauseCount: z.number().int().min(0),
  speedChangeCount: z.number().int().min(0),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

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

  // Fetch session
  const existingSession = await getSessionById(sessionId);
  if (!existingSession || existingSession.user_id !== user.id) {
    return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
  }

  if (existingSession.status !== "active") {
    return NextResponse.json(
      { success: false, error: "Session already ended", code: existingSession.status.toUpperCase() },
      { status: 409 }
    );
  }

  // Complete the session
  const completedSession = await completeSession(sessionId, user.id, {
    active_watch_seconds: parsed.data.activeWatchSeconds,
    total_elapsed_seconds: parsed.data.totalElapsedSeconds,
    watch_percentage: parsed.data.watchPercentage,
    tab_switch_count: parsed.data.tabSwitchCount,
    pause_count: parsed.data.pauseCount,
    speed_change_count: parsed.data.speedChangeCount,
  });

  // Fetch video for validation
  const video = await getVideoById(completedSession.video_id);
  if (!video) {
    return NextResponse.json({ success: false, error: "Video not found" }, { status: 404 });
  }

  // Run anti-cheat validation
  const validation = validateSession(completedSession, video);
  if (!validation.valid) {
    return NextResponse.json({
      success: true,
      data: {
        eligible: false,
        reason: validation.reason,
        code: validation.code,
      },
    });
  }

  // Calculate and create reward
  const profile = await getProfileById(user.id);
  if (!profile) {
    return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
  }

  const rewardAmount = calculateReward(video, profile);
  const reward = await createPendingReward(user.id, sessionId, rewardAmount);

  // Credit referral bonus to referrer (non-blocking)
  if (profile.referrer_id) {
    creditReferralBonus(profile.referrer_id, sessionId, rewardAmount).catch(() => {});
  }

  return NextResponse.json({
    success: true,
    data: {
      eligible: true,
      rewardAmount,
      rewardId: reward.id,
      message: `You earned ${rewardAmount} SMT! Go to your wallet to claim.`,
    },
  });
}
