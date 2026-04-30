import { createClient } from "@supabase/supabase-js";

export interface SyncYouTubeRequest {
  source: "channel" | "playlist";
  id: string; // channelId or playlistId
  maxResults?: number; // default: 50
  rewardAmount?: number; // default: 10
  minWatchPercentage?: number; // default: 0.7
}

export interface SyncYouTubeResponse {
  success: boolean;
  videosAdded: number;
  videosUpdated: number;
  message: string;
  errors?: string[];
}

/**
 * Sync YouTube videos from a channel or playlist to Supabase
 * @param request - Sync configuration
 * @returns Sync result with summary
 *
 * @example
 * // Sync from YouTube channel
 * const result = await syncYouTubeVideos({
 *   source: "channel",
 *   id: "UCxxxxxx", // YouTube channel ID
 *   maxResults: 30,
 *   rewardAmount: 15,
 * });
 *
 * @example
 * // Sync from YouTube playlist
 * const result = await syncYouTubeVideos({
 *   source: "playlist",
 *   id: "PLxxxxxx", // YouTube playlist ID
 *   maxResults: 50,
 * });
 */
export async function syncYouTubeVideos(
  request: SyncYouTubeRequest
): Promise<SyncYouTubeResponse> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );

  try {
    const { data, error } = await supabase.functions.invoke(
      "sync-youtube-videos",
      {
        body: request,
      }
    );

    if (error) {
      throw error;
    }

    return data as SyncYouTubeResponse;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      videosAdded: 0,
      videosUpdated: 0,
      message: `Failed to sync videos: ${errorMessage}`,
      errors: [errorMessage],
    };
  }
}

/**
 * Sync YouTube channel videos. Shorthand for syncYouTubeVideos()
 */
export async function syncChannelVideos(
  channelId: string,
  maxResults = 50,
  rewardAmount = 10
): Promise<SyncYouTubeResponse> {
  return syncYouTubeVideos({
    source: "channel",
    id: channelId,
    maxResults,
    rewardAmount,
  });
}

/**
 * Sync YouTube playlist videos. Shorthand for syncYouTubeVideos()
 */
export async function syncPlaylistVideos(
  playlistId: string,
  maxResults = 50,
  rewardAmount = 10
): Promise<SyncYouTubeResponse> {
  return syncYouTubeVideos({
    source: "playlist",
    id: playlistId,
    maxResults,
    rewardAmount,
  });
}
