import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const YOUTUBE_BASE = "https://www.googleapis.com/youtube/v3";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

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

interface VideoInsert {
  youtube_video_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  published_at: string | null;
  view_count: number;
  reward_amount: number;
  min_watch_percentage: number;
  is_active: boolean;
}

interface SyncRequest {
  source: "channel" | "playlist";
  id: string; // channelId or playlistId
  maxResults?: number;
  rewardAmount?: number;
  minWatchPercentage?: number;
}

interface SyncResponse {
  success: boolean;
  videosAdded: number;
  videosUpdated: number;
  message: string;
  errors?: string[];
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/** Convert ISO 8601 duration (e.g. PT1H2M3S) to total seconds */
function parseDurationISO(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const [, h = "0", m = "0", s = "0"] = match;
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s);
}

/** Convert YouTube API item to VideoInsert */
function itemToInsert(
  item: YouTubeVideoItem,
  rewardAmount = 10,
  minWatchPercentage = 0.7
): VideoInsert {
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
    reward_amount: rewardAmount,
    min_watch_percentage: minWatchPercentage,
    is_active: true,
  };
}

/** Fetch full video details (snippet + contentDetails + statistics) for up to 50 video IDs */
async function fetchVideoDetails(
  videoIds: string[],
  apiKey: string
): Promise<YouTubeVideoItem[]> {
  if (videoIds.length === 0) return [];

  const url = new URL(`${YOUTUBE_BASE}/videos`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("part", "snippet,contentDetails,statistics");
  url.searchParams.set("maxResults", "50");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`YouTube API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.items ?? [];
}

/** Fetch videos from YouTube channel */
async function fetchChannelVideos(
  channelId: string,
  apiKey: string,
  maxResults: number
): Promise<YouTubeVideoItem[]> {
  const url = new URL(`${YOUTUBE_BASE}/search`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("channelId", channelId);
  url.searchParams.set("part", "id");
  url.searchParams.set("type", "video");
  url.searchParams.set("order", "date");
  url.searchParams.set("maxResults", String(Math.min(maxResults, 50)));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`YouTube search error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const ids: string[] = (data.items ?? []).map(
    (item: { id: { videoId: string } }) => item.id.videoId
  );

  return fetchVideoDetails(ids, apiKey);
}

/** Fetch videos from YouTube playlist */
async function fetchPlaylistVideos(
  playlistId: string,
  apiKey: string,
  maxResults: number
): Promise<YouTubeVideoItem[]> {
  const url = new URL(`${YOUTUBE_BASE}/playlistItems`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("playlistId", playlistId);
  url.searchParams.set("part", "contentDetails");
  url.searchParams.set("maxResults", String(Math.min(maxResults, 50)));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`YouTube playlist error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const ids: string[] = (data.items ?? []).map(
    (item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId
  );

  return fetchVideoDetails(ids, apiKey);
}

// ─────────────────────────────────────────────────────────────────
// Main Sync Function
// ─────────────────────────────────────────────────────────────────

async function syncYouTubeVideos(req: SyncRequest, apiKey: string): Promise<SyncResponse> {
  const maxResults = req.maxResults ?? 50;
  const rewardAmount = req.rewardAmount ?? 10;
  const minWatchPercentage = req.minWatchPercentage ?? 0.7;

  try {
    // Fetch videos from YouTube
    let items: YouTubeVideoItem[] = [];

    if (req.source === "channel") {
      items = await fetchChannelVideos(req.id, apiKey, maxResults);
    } else if (req.source === "playlist") {
      items = await fetchPlaylistVideos(req.id, apiKey, maxResults);
    } else {
      throw new Error(`Unknown source: ${req.source}`);
    }

    if (items.length === 0) {
      return {
        success: true,
        videosAdded: 0,
        videosUpdated: 0,
        message: "No videos found",
      };
    }

    // Convert to database format
    const videos = items.map((item) =>
      itemToInsert(item, rewardAmount, minWatchPercentage)
    );

    // Get Supabase client
    // Note: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are automatically available in edge functions
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upsert videos (insert or update if exists)
    const { error, data } = await supabase
      .from("videos")
      .upsert(videos, { onConflict: "youtube_video_id" });

    if (error) {
      throw error;
    }

    return {
      success: true,
      videosAdded: videos.length,
      videosUpdated: 0,
      message: `Successfully synced ${videos.length} videos from ${req.source}`,
    };
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

// ─────────────────────────────────────────────────────────────────
// Edge Function Handler
// ─────────────────────────────────────────────────────────────────

// Default sources from environment variables
const DEFAULT_CHANNEL_ID = "UCd_2mFYfC0V4tPjI2EKCxKw";
const DEFAULT_PLAYLIST_ID = "PLNuFaSVDSOyoaQI9rn0D1c0Nab280dnDc";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    // Get API key from environment
    const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "YOUTUBE_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    let requests: SyncRequest[] = [];

    if (req.method === "GET") {
      // GET request: sync both channel and playlist using defaults
      const url = new URL(req.url);
      const source = url.searchParams.get("source") as "channel" | "playlist" | null;
      const id = url.searchParams.get("id");

      if (source && id) {
        // Specific source from query params: ?source=channel&id=UCxxxxxx
        requests = [{ source, id }];
      } else {
        // No params: sync both default channel and playlist
        requests = [
          { source: "channel", id: DEFAULT_CHANNEL_ID, maxResults: 50, rewardAmount: 15 },
          { source: "playlist", id: DEFAULT_PLAYLIST_ID, maxResults: 50, rewardAmount: 10 },
        ];
      }
    } else if (req.method === "POST") {
      // POST request: read from body
      const contentType = req.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        // No body or wrong content type: use defaults
        requests = [
          { source: "channel", id: DEFAULT_CHANNEL_ID, maxResults: 50, rewardAmount: 15 },
          { source: "playlist", id: DEFAULT_PLAYLIST_ID, maxResults: 50, rewardAmount: 10 },
        ];
      } else {
        try {
          const raw = await req.text();
          if (!raw || raw.trim() === "" || raw.trim() === "{}") {
            // Empty body or empty object: use defaults
            requests = [
              { source: "channel", id: DEFAULT_CHANNEL_ID, maxResults: 50, rewardAmount: 15 },
              { source: "playlist", id: DEFAULT_PLAYLIST_ID, maxResults: 50, rewardAmount: 10 },
            ];
          } else {
            const parsed = JSON.parse(raw) as Partial<SyncRequest> | Partial<SyncRequest>[];
            const arr = Array.isArray(parsed) ? parsed : [parsed];
            // If any item is missing source or id, fall back to defaults for that item
            requests = arr.map((item) => {
              if (!item.source || !item.id) {
                return [
                  { source: "channel" as const, id: DEFAULT_CHANNEL_ID, maxResults: 50, rewardAmount: 15 },
                  { source: "playlist" as const, id: DEFAULT_PLAYLIST_ID, maxResults: 50, rewardAmount: 10 },
                ];
              }
              return [item as SyncRequest];
            }).flat();
          }
        } catch {
          return new Response(
            JSON.stringify({ error: "Invalid JSON in request body" }),
            { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
          );
        }
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    // Validate all requests (safety check only — should never fail now)
    requests = requests.filter((body) => body.source && body.id);

    // Run all syncs
    const results = await Promise.all(
      requests.map((body) => syncYouTubeVideos(body, apiKey))
    );

    const combined = {
      success: results.every((r) => r.success),
      totalVideosAdded: results.reduce((sum, r) => sum + r.videosAdded, 0),
      results,
    };

    return new Response(JSON.stringify(combined), {
      status: combined.success ? 200 : 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }
});
