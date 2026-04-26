# Samono — Architecture

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui |
| Wallet | @solana/wallet-adapter (Phantom + Solflare) |
| Backend | Next.js API routes, Supabase (Postgres + Auth) |
| Blockchain | Solana (devnet → mainnet), SPL Token (SMT) |
| Data Access | Server-side DAL layer (`lib/dal/`) with Supabase service client |
| AI Tooling | Claude Code (development), session transcript exported as JSONL |

## System overview

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌───────┐ ┌──────────────┐ │
│  │Watch │ │Dash- │ │Leader│ │Wallet │ │Referral Page │ │
│  │Player│ │board │ │board │ │Claims │ │              │ │
│  └──┬───┘ └──┬───┘ └──┬───┘ └──┬────┘ └──────┬───────┘ │
│     └────────┴────────┴────────┴──────────────┘         │
│                     │ API routes                         │
│              ┌──────┴──────┐                              │
│              │  Middleware  │ (auth guard, session refresh)│
│              └──────┬──────┘                              │
└─────────────────────┼────────────────────────────────────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
   ┌────────────┐ ┌────────┐ ┌──────────┐
   │  Supabase  │ │ Solana │ │ YouTube  │
   │  (Postgres)│ │ RPC    │ │ Data API │
   └────────────┘ └────────┘ └──────────┘
```

## Directory structure

```
samono/
├── app/                        # Next.js App Router pages
│   ├── (auth)/                 # Login, register
│   ├── dashboard/              # User dashboard + swap
│   ├── watch/[videoId]/        # Video player with session tracking
│   ├── leaderboard/            # Global rankings
│   ├── wallet/                 # Reward claims
│   ├── referral/               # Referral code + stats
│   ├── profile/[username]/     # Public profile
│   └── api/                    # API routes
├── components/                 # React components
│   ├── nexus/                  # Orbital UI (StatOrb, ProximityPanel)
│   ├── ui/                     # shadcn/ui primitives
│   ├── VideoCard.tsx           # Video thumbnail card
│   ├── SessionProgress.tsx     # Watch progress indicator
│   ├── ClaimButton.tsx         # Token claim trigger
│   ├── XPProgressBar.tsx       # XP → next level visualization
│   ├── LevelBadge.tsx          # Tier badge (Rookie → Legend)
│   ├── AchievementCard.tsx     # Achievement unlock display
│   ├── LeaderboardTable.tsx    # Rankings table
│   └── ...
├── services/                   # Business logic
│   ├── reward-engine.ts        # Reward calculation + claim processing
│   ├── session-validator.ts    # Anti-sybil validation rules
│   ├── xp-engine.ts            # XP awarding, level calculation, tiers
│   └── achievement-engine.ts   # Condition evaluation + unlock
├── lib/                        # Infrastructure
│   ├── dal/                    # Data access layer (Supabase queries)
│   │   ├── profiles.ts
│   │   ├── rewards.ts
│   │   ├── sessions.ts
│   │   ├── videos.ts
│   │   └── leaderboard.ts
│   ├── solana/                 # Solana integration
│   │   ├── connection.ts       # RPC connection setup
│   │   ├── token.ts            # SPL token transfers
│   │   └── treasury.ts         # Treasury keypair management
│   ├── supabase/               # Supabase clients
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server-side + service client
│   │   └── middleware.ts       # Auth session refresh
│   ├── auth/                   # Auth actions + session helpers
│   └── youtube/                # YouTube metadata sync
├── scripts/
│   └── deploy-token.ts         # SMT token deployment (SPL)
├── hooks/
│   └── useMousePosition.ts     # Orbital UI interaction
├── supabase/
│   └── schema.sql              # Full database schema
└── middleware.ts                # Route protection (auth guard)
```

## Database schema

6 tables, all with RLS policies:

| Table | Purpose | Key constraints |
|-------|---------|----------------|
| `profiles` | User data, wallet, XP, level, streak | Extends `auth.users`, unique wallet |
| `videos` | Video metadata + reward config | Unique YouTube ID, active flag |
| `watch_sessions` | Per-user per-video tracking | Unique (user_id, video_id), anti-cheat fields |
| `rewards` | Pending/completed token claims | Status state machine, tx signature |
| `wallet_connections` | Wallet history per user | Unique (user_id, wallet_address) |
| `achievements` | Achievement definitions + conditions | JSONB condition rules, slug unique |
| `user_achievements` | Unlocked achievements per user | Junction table |

### Triggers

- **`on_auth_user_created`** — auto-creates profile row on signup
- **`on_reward_completed`** — increments `profiles.total_earned` on reward completion
- **`on_session_completed`** — updates streak count (consecutive day tracking)
- **`set_updated_at`** — auto-updates `updated_at` on profiles, rewards, videos

### Leaderboard

Materialized as a view (`public.leaderboard`) with `rank()` window function over `total_earned DESC`. Publicly readable for unauthenticated display.

## Reward flow

```
User watches video
       │
       ▼
Session tracked client-side
(tab_switches, speed_changes, active_seconds)
       │
       ▼
POST /api/sessions/complete
       │
       ▼
session-validator.ts
 ├─ Already rewarded? → REJECT
 ├─ Watch % < minimum? → REJECT
 ├─ Tab switches > 5? → REJECT
 ├─ Speed changes > 3? → REJECT
 ├─ Active ratio < 75%? → REJECT
 └─ Valid → reward-engine.ts
              │
              ├─ calculateReward() → base × streak × level × referral
              ├─ createPendingReward() → rewards table (status: pending)
              ├─ creditReferralBonus() → rewards table for referrer
              └─ awardXP() → profiles.xp updated, level recalculated
                            │
                            └─ evaluateAchievements() → check + unlock

User clicks Claim
       │
       ▼
processClaimRequest()
 ├─ Fetch pending rewards
 ├─ Mark as processing (race condition guard)
 ├─ transferSOL() via SPL token
 ├─ Mark completed with tx_signature
 └─ Return claimed total + signatures
```

## XP and level system

- **Earn rate**: 1 XP/minute of active watch, 50 XP bonus per video completed
- **Level formula**: `level = floor(sqrt(xp / 100))` — quadratic scaling
- **Tiers**: Rookie (0) → Explorer (3) → Veteran (6) → Champion (10) → Legend (15)

## Anti-sybil defenses

| Check | Threshold | Code |
|-------|-----------|------|
| Watch percentage | ≥ video's `min_watch_percentage` (default 70%) | `INSUFFICIENT_WATCH_PERCENTAGE` |
| Tab switches | ≤ 5 per session | `TAB_SWITCH_ABUSE` |
| Speed changes | ≤ 3 per session | `SPEED_MANIPULATION` |
| Active ratio | ≥ 75% active / elapsed | `LOW_ACTIVE_RATIO` |
| Watch time sanity | ≤ video duration + 10s | `INVALID_WATCH_TIME` |
| Daily sessions | ≤ 20 per user per day | `MAX_DAILY_SESSIONS` |
| Duplicate rewards | One per user per video (DB unique constraint) | `ALREADY_REWARDED` |

## Authentication flow

- Supabase Auth (email + password)
- Middleware guards protected routes: `/dashboard`, `/watch`, `/wallet`, `/leaderboard`, `/referral`
- Wallet connects separately via `@solana/wallet-adapter` (not tied to auth)
- Profile auto-created on signup via Postgres trigger

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SOLANA_RPC_URL=
SMT_MINT_ADDRESS=
TREASURY_WALLET_PATH=.treasury-keypair.json
```
