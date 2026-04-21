import { NextRequest, NextResponse } from "next/server";
import { getVideos } from "@/lib/dal/videos";
import { getSession } from "@/lib/auth/session";

export async function GET(_req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const videos = await getVideos();
    return NextResponse.json({ success: true, data: videos });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}
