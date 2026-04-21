import type { WatchSession, Video } from "@/types/database";

// Anti-cheat thresholds
const MAX_TAB_SWITCHES = 5;
const MAX_SPEED_CHANGES = 3;
const MIN_ACTIVE_RATIO = 0.75; // 75% active watch vs elapsed
const MAX_DAILY_SESSIONS = 20;

export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string; code: string };

/**
 * Validate a completed watch session against fraud rules.
 * Returns { valid: true } or { valid: false, reason, code }.
 */
export function validateSession(
  session: WatchSession,
  video: Video
): ValidationResult {
  // Already rewarded — idempotency guard
  if (session.is_rewarded) {
    return { valid: false, reason: "Session already rewarded", code: "ALREADY_REWARDED" };
  }

  // Must be completed
  if (session.status !== "completed") {
    return { valid: false, reason: "Session not completed", code: "SESSION_NOT_COMPLETE" };
  }

  // Minimum watch percentage
  if (session.watch_percentage < video.min_watch_percentage) {
    return {
      valid: false,
      reason: `Minimum watch percentage not reached (${Math.round(session.watch_percentage * 100)}% < ${Math.round(video.min_watch_percentage * 100)}%)`,
      code: "INSUFFICIENT_WATCH_PERCENTAGE",
    };
  }

  // Tab switching abuse
  if (session.tab_switch_count > MAX_TAB_SWITCHES) {
    return {
      valid: false,
      reason: `Too many tab switches (${session.tab_switch_count})`,
      code: "TAB_SWITCH_ABUSE",
    };
  }

  // Speed manipulation
  if (session.speed_change_count > MAX_SPEED_CHANGES) {
    return {
      valid: false,
      reason: `Too many speed changes (${session.speed_change_count})`,
      code: "SPEED_MANIPULATION",
    };
  }

  // Active ratio check — user must actually be watching
  if (
    session.total_elapsed_seconds > 0 &&
    session.active_watch_seconds / session.total_elapsed_seconds < MIN_ACTIVE_RATIO
  ) {
    return {
      valid: false,
      reason: `Active watch ratio too low (${Math.round((session.active_watch_seconds / session.total_elapsed_seconds) * 100)}%)`,
      code: "LOW_ACTIVE_RATIO",
    };
  }

  // Sanity: active watch can't exceed video duration + 10s buffer
  if (session.active_watch_seconds > video.duration_seconds + 10) {
    return {
      valid: false,
      reason: "Active watch time exceeds video duration",
      code: "INVALID_WATCH_TIME",
    };
  }

  return { valid: true };
}

export { MAX_DAILY_SESSIONS };
