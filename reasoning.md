# Samono — Reasoning

## Problem

Online video platforms extract value from viewers' attention but return nothing. Creators earn through ad revenue (which platforms control), while viewers who generate the watch time that makes content valuable get zero economic participation. This one-sided model limits creator earnings and gives viewers no incentive to engage deeply or consistently.

## Why Solana

Token rewards need to be fast, cheap, and composable. Solana's sub-second finality and near-zero fees make micro-reward distributions viable — a $0.001 reward isn't worth claiming on Ethereum but is seamless on Solana. SPL tokens also give us a standard, interoperable reward unit that users can hold, trade, or use across the broader Solana ecosystem.

## Why watch-to-earn

The watch-to-earn model aligns incentives: creators get more watch time (which boosts their content), viewers earn tokens for their attention, and the platform grows through referral-driven network effects. Unlike play-to-earn, which requires gaming skill or financial commitment, watching video is a zero-barrier activity that billions of people already do daily.

## Core design decisions

### Anti-sybil is the critical problem

Any earn system attracts bots. We chose to solve this at the session-validation layer rather than relying solely on KYC or CAPTCHAs. The `session-validator` tracks:
- **Tab switch count** — bots flip tabs to farm multiple videos; we cap at 5 switches
- **Speed change count** — bots speed up playback; we cap at 3 changes
- **Active watch ratio** — minimum 75% of elapsed time must be active watching
- **Watch percentage** — must exceed the video's configured minimum (default 70%)
- **Daily session cap** — max 20 sessions per day per user

These checks run server-side, making client-side spoofing harder. The one-reward-per-user-per-video constraint is enforced at the database level with a unique index.

### Tiered reward multipliers over flat rewards

Flat per-video rewards don't reward loyalty. We use three multiplier layers:
1. **Streak multiplier**: +5% per consecutive watch day, capped at 2x — rewards daily engagement
2. **Level bonus**: +5% per level — rewards long-term progression
3. **Referral bonus**: +10% for referred users, plus the referrer gets 10% of their earnings — creates a growth flywheel

This structure means a day-1 user earns base rewards, while a consistent user with referrals can earn 2-3x per video.

### Supabase + Solana split

Session data, profiles, and achievements live in Supabase (Postgres) because they need complex queries, joins, and fast reads for the leaderboard. Token transfers and wallet operations live on-chain because they need trustless settlement. The reward table bridges both: it tracks pending rewards in Postgres with status tracking, then settles on-chain when the user claims.

### XP and levels as a retention layer

The XP system (1 XP per minute watched, 50 XP bonus per video completed) with a quadratic level curve (level N requires N² × 100 XP) creates a progression that feels fast early but demands more commitment over time. The five named tiers (Rookie → Legend) with color-coded badges give social status within the platform. Achievement unlocks with bonus XP (e.g., "Streak Master" gives 500 XP for a 7-day streak) provide mid-term goals beyond daily watching.

## What we're not building (yet)

- **Creator upload tools**: Currently syncing from YouTube via metadata. Native upload is post-launch.
- **Token governance/DAO**: SMT is a utility reward token. Governance would require a separate token and legal analysis.
- **Mobile app**: Web-first. Mobile responsiveness via Next.js responsive design, not a native app.
- **Ad integration**: The revenue model is token-based, not ad-based. Creator monetization comes from boosted visibility through the reward pool.
