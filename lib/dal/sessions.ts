import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { WatchSession, WatchSessionInsert, WatchSessionUpdate } from "@/types/database";

/** Create a new watch session */
export async function createSession(
  userId: string,
  videoId: string
): Promise<WatchSession> {
  const supabase = createServiceClient();

  // Check for existing active session and invalidate it
  const { data: existing } = await supabase
    .from("watch_sessions")
    .select("id, status")
    .eq("user_id", userId)
    .eq("video_id", videoId)
    .single();

  if (existing) {
    if (existing.status === "completed") {
      throw new Error("ALREADY_COMPLETED");
    }
    if (existing.status === "active") {
      // Invalidate stale active session
      await supabase
        .from("watch_sessions")
        .update({ status: "invalidated" })
        .eq("id", existing.id);
    }
  }

  const { data, error } = await supabase
    .from("watch_sessions")
    .insert({ user_id: userId, video_id: videoId, status: "active" } as WatchSessionInsert)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Update heartbeat data on an active session */
export async function updateSessionHeartbeat(
  sessionId: string,
  userId: string,
  update: WatchSessionUpdate
): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("watch_sessions")
    .update(update)
    .eq("id", sessionId)
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) throw error;
}

/** Mark a session complete and return it */
export async function completeSession(
  sessionId: string,
  userId: string,
  finalData: WatchSessionUpdate
): Promise<WatchSession> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("watch_sessions")
    .update({
      ...finalData,
      status: "completed",
      ended_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", userId)
    .eq("status", "active")
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Get active session if any */
export async function getActiveSession(
  userId: string,
  videoId: string
): Promise<WatchSession | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("watch_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("video_id", videoId)
    .eq("status", "active")
    .single();

  return data ?? null;
}

/** Get a session by ID (service role) */
export async function getSessionById(id: string): Promise<WatchSession | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("watch_sessions")
    .select("*")
    .eq("id", id)
    .single();

  return data ?? null;
}

/** Get session count for rate limiting (max per day) */
export async function getDailySessionCount(userId: string): Promise<number> {
  const supabase = createServiceClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("watch_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("started_at", startOfDay.toISOString());

  return count ?? 0;
}
