import { syncYouTubeVideos, type SyncYouTubeRequest } from "./sync";

export interface YouTubeSyncConfig {
  name: string;
  source: "channel" | "playlist";
  id: string;
  maxResults?: number;
  rewardAmount?: number;
  minWatchPercentage?: number;
}

export interface BatchSyncResult {
  configName: string;
  success: boolean;
  videosAdded: number;
  videosUpdated: number;
  message: string;
  errors?: string[];
}

/**
 * Batch sync multiple YouTube sources
 * Useful for syncing multiple channels or playlists at once
 *
 * @param configs - Array of sync configurations
 * @param delayMs - Delay between requests in milliseconds (default: 1000 to avoid rate limiting)
 * @returns Array of sync results
 *
 * @example
 * const configs = [
 *   {
 *     name: "Main Channel",
 *     source: "channel",
 *     id: "UCxxxxxx",
 *     rewardAmount: 15,
 *   },
 *   {
 *     name: "Playlist",
 *     source: "playlist",
 *     id: "PLxxxxxx",
 *     rewardAmount: 10,
 *   },
 * ];
 *
 * const results = await batchSyncYouTubeVideos(configs, 1000);
 * results.forEach(r => {
 *   console.log(`${r.configName}: ${r.videosAdded} videos added`);
 * });
 */
export async function batchSyncYouTubeVideos(
  configs: YouTubeSyncConfig[],
  delayMs = 1000
): Promise<BatchSyncResult[]> {
  const results: BatchSyncResult[] = [];

  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];

    try {
      const request: SyncYouTubeRequest = {
        source: config.source,
        id: config.id,
        maxResults: config.maxResults,
        rewardAmount: config.rewardAmount,
        minWatchPercentage: config.minWatchPercentage,
      };

      const result = await syncYouTubeVideos(request);

      results.push({
        configName: config.name,
        ...result,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        configName: config.name,
        success: false,
        videosAdded: 0,
        videosUpdated: 0,
        message: `Failed: ${errorMessage}`,
        errors: [errorMessage],
      });
    }

    // Add delay between requests to avoid rate limiting
    if (i < configs.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Built-in sync profiles for common use cases
 * Extend this with your own source configurations
 */
export const PREDEFINED_SOURCES: Record<string, YouTubeSyncConfig> = {
  // Example: Add your channel/playlist configs here
  // main_channel: {
  //   name: "Main Channel",
  //   source: "channel",
  //   id: "UCxxxxxx",
  //   rewardAmount: 15,
  //   maxResults: 50,
  // },
};

/**
 * Get predefined source by key
 */
export function getPredefinedSource(key: string): YouTubeSyncConfig | null {
  return PREDEFINED_SOURCES[key] || null;
}

/**
 * Get all predefined sources
 */
export function getAllPredefinedSources(): YouTubeSyncConfig[] {
  return Object.values(PREDEFINED_SOURCES);
}

/**
 * Sync all predefined sources
 * Typical use case: Call from scheduled job/cron
 */
export async function syncAllPredefinedSources(
  delayMs = 1000
): Promise<BatchSyncResult[]> {
  const configs = getAllPredefinedSources();

  if (configs.length === 0) {
    console.warn("No predefined YouTube sources configured");
    return [];
  }

  console.log(`Starting batch sync for ${configs.length} sources...`);
  const results = await batchSyncYouTubeVideos(configs, delayMs);

  const summary = {
    total: results.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    totalVideosAdded: results.reduce((sum, r) => sum + r.videosAdded, 0),
  };

  console.log("Batch sync complete:", summary);
  return results;
}
