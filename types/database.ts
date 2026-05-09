// ─────────────────────────────────────────────────────────────────
// Database Type Definitions (mirrors Supabase schema)
// ─────────────────────────────────────────────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: Array<{
          foreignKeyName: string;
          columns: string[];
          referencedRelation: string;
          referencedColumns: string[];
        }>;
      };
      videos: {
        Row: Video;
        Insert: VideoInsert;
        Update: VideoUpdate;
        Relationships: Array<{
          foreignKeyName: string;
          columns: string[];
          referencedRelation: string;
          referencedColumns: string[];
        }>;
      };
      watch_sessions: {
        Row: WatchSession;
        Insert: WatchSessionInsert;
        Update: WatchSessionUpdate;
        Relationships: Array<{
          foreignKeyName: string;
          columns: string[];
          referencedRelation: string;
          referencedColumns: string[];
        }>;
      };
      rewards: {
        Row: Reward;
        Insert: RewardInsert;
        Update: RewardUpdate;
        Relationships: Array<{
          foreignKeyName: string;
          columns: string[];
          referencedRelation: string;
          referencedColumns: string[];
        }>;
      };
      wallet_connections: {
        Row: WalletConnection;
        Insert: WalletConnectionInsert;
        Update: WalletConnectionUpdate;
        Relationships: Array<{
          foreignKeyName: string;
          columns: string[];
          referencedRelation: string;
          referencedColumns: string[];
        }>;
      };
      achievements: {
        Row: Achievement;
        Insert: Omit<Achievement, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<Achievement, "id" | "created_at">>;
        Relationships: [];
      };
      user_achievements: {
        Row: UserAchievement;
        Insert: UserAchievement;
        Update: Partial<UserAchievement>;
        Relationships: [];
      };
    };
    Views: {
      leaderboard: {
        Row: LeaderboardEntry;
        Relationships: Array<{
          foreignKeyName: string;
          columns: string[];
          referencedRelation: string;
          referencedColumns: string[];
        }>;
      };
    };
    Functions: {
      [functionName: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
  };
}

// ─────────────────────────────────────────────────────────────────
// Profiles
// ─────────────────────────────────────────────────────────────────
export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  wallet_address: string | null;
  total_earned: number;
  streak_count: number;
  last_watch_date: string | null;
  referrer_id: string | null;
  xp: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export type ProfileInsert = Omit<Profile, "total_earned" | "streak_count" | "xp" | "level" | "created_at" | "updated_at" | "avatar_url" | "wallet_address" | "last_watch_date" | "referrer_id"> & {
  total_earned?: number;
  streak_count?: number;
  xp?: number;
  level?: number;
  avatar_url?: string | null;
  wallet_address?: string | null;
  last_watch_date?: string | null;
  referrer_id?: string | null;
};

export type ProfileUpdate = Partial<Omit<Profile, "id" | "created_at">>;

// ─────────────────────────────────────────────────────────────────
// Videos
// ─────────────────────────────────────────────────────────────────
export type Video = {
  id: string;
  youtube_video_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  reward_amount: number;
  reward_point: number;
  min_watch_percentage: number;
  is_active: boolean;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type VideoInsert = Omit<Video, "id" | "view_count" | "created_at" | "updated_at" | "reward_point"> & {
  id?: string;
  view_count?: number;
  reward_point?: number;
};

export type VideoUpdate = Partial<Omit<Video, "id" | "created_at">>;

// ─────────────────────────────────────────────────────────────────
// Watch Sessions
// ─────────────────────────────────────────────────────────────────
export type WatchSessionStatus = "active" | "completed" | "invalidated";

export type WatchSession = {
  id: string;
  user_id: string;
  video_id: string;
  started_at: string;
  ended_at: string | null;
  active_watch_seconds: number;
  total_elapsed_seconds: number;
  watch_percentage: number;
  tab_switch_count: number;
  pause_count: number;
  speed_change_count: number;
  status: WatchSessionStatus;
  is_rewarded: boolean;
  created_at: string;
}

export type WatchSessionInsert = Omit<WatchSession, "id" | "started_at" | "created_at" | "active_watch_seconds" | "total_elapsed_seconds" | "watch_percentage" | "tab_switch_count" | "pause_count" | "speed_change_count" | "is_rewarded"> & {
  active_watch_seconds?: number;
  total_elapsed_seconds?: number;
  watch_percentage?: number;
  tab_switch_count?: number;
  pause_count?: number;
  speed_change_count?: number;
  is_rewarded?: boolean;
};

export type WatchSessionUpdate = Partial<Omit<WatchSession, "id" | "user_id" | "video_id" | "started_at" | "created_at">>;

// ─────────────────────────────────────────────────────────────────
// Rewards
// ─────────────────────────────────────────────────────────────────
export type RewardStatus = "pending" | "processing" | "completed" | "failed";

export type Reward = {
  id: string;
  user_id: string;
  watch_session_id: string;
  amount: number;
  status: RewardStatus;
  wallet_address: string | null;
  tx_signature: string | null;
  error_message: string | null;
  retry_count: number;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type RewardInsert = Omit<Reward, "id" | "created_at" | "updated_at" | "retry_count"> & {
  retry_count?: number;
};

export type RewardUpdate = Partial<Omit<Reward, "id" | "created_at">>;

// ─────────────────────────────────────────────────────────────────
// Wallet Connections
// ─────────────────────────────────────────────────────────────────
export type WalletType = "phantom" | "solflare" | "other";

export type WalletConnection = {
  id: string;
  user_id: string;
  wallet_address: string;
  wallet_type: WalletType;
  is_primary: boolean;
  connected_at: string;
}

export type WalletConnectionInsert = Omit<WalletConnection, "id" | "connected_at"> & {
  connected_at?: string;
};

export type WalletConnectionUpdate = Partial<Omit<WalletConnection, "id" | "user_id" | "connected_at">>;

// ─────────────────────────────────────────────────────────────────
// Leaderboard View
// ─────────────────────────────────────────────────────────────────
export type LeaderboardEntry = {
  id: string;
  username: string;
  avatar_url: string | null;
  wallet_address: string | null;
  total_earned: number;
  xp: number;
  watch_streak: number;
  rank: number;
}

// ─────────────────────────────────────────────────────────────────
// Achievements
// ─────────────────────────────────────────────────────────────────
export type AchievementConditionType = "videos_watched" | "streak_days" | "total_xp" | "watch_minutes";

export type AchievementCondition = {
  type: AchievementConditionType;
  threshold: number;
};

export type Achievement = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  condition_json: Json;
  xp_reward: number;
  created_at: string;
};

export type UserAchievement = {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
};

/** Achievement row joined with its unlock timestamp (null = not yet unlocked) */
export type AchievementWithStatus = Achievement & {
  unlocked_at: string | null;
};
