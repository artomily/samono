-- ─────────────────────────────────────────────────────────────────
-- SMT Watch — Supabase Database Schema
-- Run this in the Supabase SQL Editor (Database > SQL Editor > New Query)
-- ─────────────────────────────────────────────────────────────────

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────
-- 1. PROFILES
-- Extends auth.users with app-specific data
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid        primary key references auth.users(id) on delete cascade,
  username        text        unique,
  avatar_url      text,
  wallet_address  text        unique,
  total_earned    numeric     not null default 0,
  streak_count    int         not null default 0,
  last_watch_date date,
  referrer_id     uuid        references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: users can view own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles: users can update own" on public.profiles
  for update using (auth.uid() = id);

-- Public leaderboard read (for select of total_earned + username + streak only — handled via view below)
create policy "profiles: public can view for leaderboard" on public.profiles
  for select using (true);

-- ─────────────────────────────────────────────────────────────────
-- 2. VIDEOS
-- Video metadata synced from YouTube
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.videos (
  id                    uuid        primary key default gen_random_uuid(),
  youtube_video_id      text        not null unique,
  title                 text        not null,
  description           text,
  thumbnail_url         text,
  duration_seconds      int         not null default 0,
  reward_amount         numeric     not null default 10,
  min_watch_percentage  numeric     not null default 0.70,
  is_active             boolean     not null default true,
  view_count            int         not null default 0,
  published_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.videos enable row level security;

-- All authenticated users can read active videos
create policy "videos: authenticated users can read" on public.videos
  for select to authenticated using (is_active = true);

-- Service role can do everything (for sync job)
-- No additional policy needed — service role bypasses RLS

-- ─────────────────────────────────────────────────────────────────
-- 3. WATCH SESSIONS
-- Tracks individual user viewing sessions with anti-cheat data
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.watch_sessions (
  id                      uuid        primary key default gen_random_uuid(),
  user_id                 uuid        not null references public.profiles(id) on delete cascade,
  video_id                uuid        not null references public.videos(id) on delete cascade,
  started_at              timestamptz not null default now(),
  ended_at                timestamptz,
  active_watch_seconds    int         not null default 0,
  total_elapsed_seconds   int         not null default 0,
  watch_percentage        numeric     not null default 0,
  tab_switch_count        int         not null default 0,
  pause_count             int         not null default 0,
  speed_change_count      int         not null default 0,
  status                  text        not null default 'active'
    check (status in ('active', 'completed', 'invalidated')),
  is_rewarded             boolean     not null default false,
  created_at              timestamptz not null default now(),
  -- One reward per user per video (enforced at DB level)
  unique (user_id, video_id)
);

alter table public.watch_sessions enable row level security;

create policy "watch_sessions: users can view own" on public.watch_sessions
  for select using (auth.uid() = user_id);

create policy "watch_sessions: users can insert own" on public.watch_sessions
  for insert with check (auth.uid() = user_id);

create policy "watch_sessions: users can update own active" on public.watch_sessions
  for update using (auth.uid() = user_id and status = 'active');

-- Indexes for performance
create index if not exists idx_watch_sessions_user_status
  on public.watch_sessions (user_id, status);

create index if not exists idx_watch_sessions_user_video
  on public.watch_sessions (user_id, video_id);

-- ─────────────────────────────────────────────────────────────────
-- 4. REWARDS
-- Pending / completed reward claims
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.rewards (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references public.profiles(id) on delete cascade,
  watch_session_id  uuid        not null unique references public.watch_sessions(id) on delete cascade,
  amount            numeric     not null,
  status            text        not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  wallet_address    text,
  tx_signature      text,
  error_message     text,
  retry_count       int         not null default 0,
  claimed_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.rewards enable row level security;

create policy "rewards: users can view own" on public.rewards
  for select using (auth.uid() = user_id);

-- No client INSERT/UPDATE — service role only
create index if not exists idx_rewards_user_status
  on public.rewards (user_id, status);

create index if not exists idx_rewards_tx_signature
  on public.rewards (tx_signature)
  where tx_signature is not null;

-- ─────────────────────────────────────────────────────────────────
-- 5. WALLET CONNECTIONS
-- Tracks all wallets ever connected by a user
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.wallet_connections (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  wallet_address  text        not null,
  wallet_type     text        not null check (wallet_type in ('phantom', 'solflare', 'other')),
  is_primary      boolean     not null default false,
  connected_at    timestamptz not null default now(),
  unique (user_id, wallet_address)
);

alter table public.wallet_connections enable row level security;

create policy "wallet_connections: users can view own" on public.wallet_connections
  for select using (auth.uid() = user_id);

create policy "wallet_connections: users can insert own" on public.wallet_connections
  for insert with check (auth.uid() = user_id);

create policy "wallet_connections: users can delete own" on public.wallet_connections
  for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────
-- 6. TRIGGERS
-- ─────────────────────────────────────────────────────────────────

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update profiles.total_earned when reward is completed
create or replace function public.update_total_earned()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'completed' and (old.status is null or old.status <> 'completed') then
    update public.profiles
    set total_earned = total_earned + new.amount,
        updated_at   = now()
    where id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_reward_completed on public.rewards;
create trigger on_reward_completed
  after insert or update of status on public.rewards
  for each row execute procedure public.update_total_earned();

-- Update streak count when watch session is completed
create or replace function public.update_streak()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_last_date date;
  v_today     date := current_date;
begin
  if new.status = 'completed' and (old.status is null or old.status <> 'completed') then
    select last_watch_date into v_last_date
    from public.profiles
    where id = new.user_id;

    if v_last_date = v_today then
      -- Already watched today, no streak change
      null;
    elsif v_last_date = v_today - interval '1 day' then
      -- Consecutive day
      update public.profiles
      set streak_count    = streak_count + 1,
          last_watch_date = v_today,
          updated_at      = now()
      where id = new.user_id;
    else
      -- Streak broken or first time
      update public.profiles
      set streak_count    = 1,
          last_watch_date = v_today,
          updated_at      = now()
      where id = new.user_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_session_completed on public.watch_sessions;
create trigger on_session_completed
  after insert or update of status on public.watch_sessions
  for each row execute procedure public.update_streak();

-- updated_at auto-update helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_rewards_updated_at
  before update on public.rewards
  for each row execute procedure public.set_updated_at();

create trigger set_videos_updated_at
  before update on public.videos
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- 7. LEADERBOARD VIEW (public, no PII)
-- ─────────────────────────────────────────────────────────────────
create or replace view public.leaderboard as
select
  p.id,
  p.username,
  p.avatar_url,
  p.total_earned,
  p.streak_count,
  rank() over (order by p.total_earned desc) as rank
from public.profiles p
where p.total_earned > 0
order by p.total_earned desc;

-- Grant read access to authenticated users
grant select on public.leaderboard to authenticated;
