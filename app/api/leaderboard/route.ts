import { NextRequest, NextResponse } from "next/server";
import { getTopEarners } from "@/lib/dal/leaderboard";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const top = await getTopEarners(50);
    return NextResponse.json({ success: true, data: top });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
