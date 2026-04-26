/**
 * Dummy mode — replaces all Supabase calls with local mock data.
 * Enable by setting DUMMY_MODE=true in .env.local
 */

export const DUMMY_MODE = process.env.DUMMY_MODE === "true";

export const DUMMY_USER_ID = "00000000-0000-0000-0000-000000000001";
export const DUMMY_WALLET = "DevMode1111111111111111111111111111111111";

/** Matches the shape returned by supabase.auth.getUser() */
export const DUMMY_USER = {
  id: DUMMY_USER_ID,
  aud: "authenticated",
  role: "authenticated",
  email: `${DUMMY_WALLET.toLowerCase()}@wallet.sol`,
  email_confirmed_at: new Date().toISOString(),
  phone: "",
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { wallet_address: DUMMY_WALLET },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_anonymous: false,
} as const;

export const DUMMY_PROFILE = {
  id: DUMMY_USER_ID,
  username: "dev_user",
  wallet_address: DUMMY_WALLET,
  avatar_url: null,
  total_earned: 1234.5,
  streak_count: 7,
  last_watch_date: new Date().toISOString(),
  referrer_id: null,
  xp: 1250,
  level: 3,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const DUMMY_VIDEOS = [
  {
    id: "vid-001",
    youtube_video_id: "dQw4w9WgXcQ",
    title: "Intro to Blockchain Technology",
    description: "Learn the fundamentals of blockchain in under 10 minutes.",
    thumbnail_url: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    duration_seconds: 600,
    reward_amount: 0.5,
    view_count: 128,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "vid-002",
    youtube_video_id: "9bZkp7q19f0",
    title: "Solana vs Ethereum: Key Differences",
    description: "A deep dive into how Solana and Ethereum differ in architecture.",
    thumbnail_url: "https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg",
    duration_seconds: 480,
    reward_amount: 0.4,
    view_count: 87,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "vid-003",
    youtube_video_id: "ysz5S6PUM-U",
    title: "DeFi Explained Simply",
    description: "What is decentralized finance and why does it matter?",
    thumbnail_url: "https://img.youtube.com/vi/ysz5S6PUM-U/hqdefault.jpg",
    duration_seconds: 420,
    reward_amount: 0.35,
    view_count: 56,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const DUMMY_REWARDS = [
  {
    id: "rew-001",
    user_id: DUMMY_USER_ID,
    video_id: "vid-001",
    amount: 0.5,
    status: "pending" as const,
    tx_signature: null,
    created_at: new Date(Date.now() - 3600_000).toISOString(),
    updated_at: new Date(Date.now() - 3600_000).toISOString(),
  },
  {
    id: "rew-002",
    user_id: DUMMY_USER_ID,
    video_id: "vid-002",
    amount: 0.4,
    status: "pending" as const,
    tx_signature: null,
    created_at: new Date(Date.now() - 7200_000).toISOString(),
    updated_at: new Date(Date.now() - 7200_000).toISOString(),
  },
];

export const DUMMY_STATS = {
  videosWatched: 23,
  totalEarned: 1234.5,
  streakCount: 7,
};

export const DUMMY_ACHIEVEMENTS = [
  {
    id: "ach-001",
    slug: "first_watch",
    name: "First Watch",
    description: "Watch your first video to completion.",
    icon: "🎬",
    condition_json: { type: "videos_watched", threshold: 1 },
    xp_reward: 100,
    created_at: new Date().toISOString(),
  },
  {
    id: "ach-002",
    slug: "loyal_viewer",
    name: "Loyal Viewer",
    description: "Complete 5 videos.",
    icon: "👁",
    condition_json: { type: "videos_watched", threshold: 5 },
    xp_reward: 150,
    created_at: new Date().toISOString(),
  },
  {
    id: "ach-003",
    slug: "grinder",
    name: "Grinder",
    description: "Complete 10 videos.",
    icon: "💪",
    condition_json: { type: "videos_watched", threshold: 10 },
    xp_reward: 250,
    created_at: new Date().toISOString(),
  },
  {
    id: "ach-004",
    slug: "streak_master",
    name: "Streak Master",
    description: "Maintain a 7-day watch streak.",
    icon: "🔥",
    condition_json: { type: "streak_days", threshold: 7 },
    xp_reward: 500,
    created_at: new Date().toISOString(),
  },
  {
    id: "ach-005",
    slug: "focus_mode",
    name: "Focus Mode",
    description: "Accumulate 30 minutes of active watch time.",
    icon: "🎯",
    condition_json: { type: "watch_minutes", threshold: 30 },
    xp_reward: 200,
    created_at: new Date().toISOString(),
  },
];

/** Achievements unlocked by dev_user — first two are earned */
export const DUMMY_USER_ACHIEVEMENT_IDS = new Set(["ach-001", "ach-002"]);
