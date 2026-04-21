import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { Video, VideoInsert } from "@/types/database";

/** Get all active videos for the dashboard */
export async function getVideos(): Promise<Video[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Get a single video by its DB id */
export async function getVideoById(id: string): Promise<Video | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data;
}

/** Get a video by YouTube video id */
export async function getVideoByYouTubeId(youtubeId: string): Promise<Video | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("videos")
    .select("*")
    .eq("youtube_video_id", youtubeId)
    .single();

  return data ?? null;
}

/** Increment view count when video is opened */
export async function incrementViewCount(videoId: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase.rpc("increment" as never, { table: "videos", id: videoId, column: "view_count" });
  // Fallback direct update if RPC not available
  const { data: video } = await supabase
    .from("videos")
    .select("view_count")
    .eq("id", videoId)
    .single();
  if (video) {
    await supabase
      .from("videos")
      .update({ view_count: (video.view_count ?? 0) + 1 })
      .eq("id", videoId);
  }
}

/**
 * Upsert videos from YouTube sync.
 * Only updates non-critical fields to avoid overwriting admin-set reward_amount.
 */
export async function upsertVideos(videos: VideoInsert[]): Promise<{ count: number }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("videos")
    .upsert(videos, {
      onConflict: "youtube_video_id",
      ignoreDuplicates: false,
    })
    .select("id");

  if (error) throw error;
  return { count: data?.length ?? 0 };
}
