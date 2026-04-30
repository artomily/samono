import { syncYouTubeVideos } from "@/lib/youtube/sync";
import { NextRequest, NextResponse } from "next/server";

/**
 * Admin endpoint to sync YouTube videos from channel or playlist
 *
 * POST /api/admin/videos/sync
 * {
 *   "source": "channel" | "playlist",
 *   "id": "UCxxxxxx or PLxxxxxx",
 *   "maxResults": 50,
 *   "rewardAmount": 10,
 *   "minWatchPercentage": 0.7
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // TODO: Add authentication check
    // if (!isAdmin(req)) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const body = await req.json();

    // Validate required fields
    if (!body.source || !body.id) {
      return NextResponse.json(
        { error: "Missing required fields: source, id" },
        { status: 400 }
      );
    }

    // Validate source
    if (!["channel", "playlist"].includes(body.source)) {
      return NextResponse.json(
        { error: "Invalid source. Must be 'channel' or 'playlist'" },
        { status: 400 }
      );
    }

    // Call edge function
    const result = await syncYouTubeVideos({
      source: body.source,
      id: body.id,
      maxResults: body.maxResults || 50,
      rewardAmount: body.rewardAmount || 10,
      minWatchPercentage: body.minWatchPercentage || 0.7,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error syncing YouTube videos:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
