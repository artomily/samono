import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { updateSessionHeartbeat } from "@/lib/dal/sessions";

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
  if (!sessionId) {
    return NextResponse.json({ success: false, error: "Missing sessionId" }, { status: 400 });
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

  try {
    await updateSessionHeartbeat(sessionId, user.id, {
      active_watch_seconds: parsed.data.activeWatchSeconds,
      total_elapsed_seconds: parsed.data.totalElapsedSeconds,
      watch_percentage: parsed.data.watchPercentage,
      tab_switch_count: parsed.data.tabSwitchCount,
      pause_count: parsed.data.pauseCount,
      speed_change_count: parsed.data.speedChangeCount,
    });
    return NextResponse.json({ success: true });
  } catch {
    // Heartbeat failures are non-fatal — client continues
    return NextResponse.json({ success: false, error: "Session not found or expired" }, { status: 404 });
  }
}
