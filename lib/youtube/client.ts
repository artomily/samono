import type { VideoInsert } from "@/types/database";

const YOUTUBE_BASE = "https://www.googleapis.com/youtube/v3";

function apiKey() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not set");
  return key;
}

/** Convert ISO 8601 duration (e.g. PT1H2M3S) to total seconds */
export function parseDurationISO(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const [, h = "0", m = "0", s = "0"] = match;
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s);
}

interface YouTubeVideoItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      maxres?: { url: string };
      high?: { url: string };
      medium?: { url: string };
    };
  };
  contentDetails: {
    duration: string;
  };
  statistics?: {
    viewCount?: string;
  };
}

/** Fetch full video details (snippet + contentDetails + statistics) for up to 50 video IDs */
async function fetchVideoDetails(videoIds: string[]): Promise<YouTubeVideoItem[]> {
  if (videoIds.length === 0) return [];

  const url = new URL(`${YOUTUBE_BASE}/videos`);
  url.searchParams.set("key", apiKey());
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("part", "snippet,contentDetails,statistics");
  url.searchParams.set("maxResults", "50");

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`YouTube API error: ${res.status} ${await res.text()}`);

  const data = await res.json();
  return data.items ?? [];
}

/** Convert a YouTube API item to a Supabase VideoInsert */
function itemToInsert(item: YouTubeVideoItem): VideoInsert {
  const thumbnail =
    item.snippet.thumbnails.maxres?.url ??
    item.snippet.thumbnails.high?.url ??
    item.snippet.thumbnails.medium?.url ??
    null;

  return {
    youtube_video_id: item.id,
    title: item.snippet.title,
    description: item.snippet.description ?? null,
    thumbnail_url: thumbnail,
    duration_seconds: parseDurationISO(item.contentDetails.duration),
    published_at: item.snippet.publishedAt ?? null,
    view_count: Number(item.statistics?.viewCount ?? 0),
    reward_amount: 10, // default — admins can override in DB
    min_watch_percentage: 0.7,
    is_active: true,
  };
}

/**
 * Fetch all public videos from a YouTube channel (search endpoint).
 * Returns up to 50 most recent videos.
 */
export async function fetchChannelVideos(
  channelId: string,
  maxResults = 50
): Promise<VideoInsert[]> {
  const url = new URL(`${YOUTUBE_BASE}/search`);
  url.searchParams.set("key", apiKey());
  url.searchParams.set("channelId", channelId);
  url.searchParams.set("part", "id");
  url.searchParams.set("type", "video");
  url.searchParams.set("order", "date");
  url.searchParams.set("maxResults", String(Math.min(maxResults, 50)));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube search error: ${res.status} ${await res.text()}`);

  const data = await res.json();
  const ids: string[] = (data.items ?? []).map((item: { id: { videoId: string } }) => item.id.videoId);

  const details = await fetchVideoDetails(ids);
  return details.map(itemToInsert);
}

/**
 * Fetch videos from a specific playlist.
 * Returns up to 50 videos.
 */
export async function fetchPlaylistVideos(
  playlistId: string,
  maxResults = 50
): Promise<VideoInsert[]> {
  const url = new URL(`${YOUTUBE_BASE}/playlistItems`);
  url.searchParams.set("key", apiKey());
  url.searchParams.set("playlistId", playlistId);
  url.searchParams.set("part", "contentDetails");
  url.searchParams.set("maxResults", String(Math.min(maxResults, 50)));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube playlist error: ${res.status} ${await res.text()}`);

  const data = await res.json();
  const ids: string[] = (data.items ?? []).map(
    (item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId
  );

  const details = await fetchVideoDetails(ids);
  return details.map(itemToInsert);
}
