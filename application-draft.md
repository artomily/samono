# Agentic Engineering Grant Application — Samono

**Submit at**: https://superteam.fun/earn/grants/agentic-engineering
**Grant amount**: 200 USDG

---

## Step 1: Basics

**Project Title**
> Samono

**One Line Description**
> A watch-to-earn platform on Solana where users earn SMT tokens by watching video content, with gamification (XP, levels, achievements) and a referral reward system.

**TG username**
> t.me/artomily

**Wallet Address**
> 8S2Uhxa5byR9LfNVYYJHujQcP7Bo9WAKt1CbCVS8d44h

---

## Step 2: Details

**Project Details**

Content creators struggle to monetize engagement, and viewers receive nothing in return for their attention. Samono flips this model by building a watch-to-earn platform on Solana where viewers earn SMT tokens for watching video content. The platform uses an on-chain reward engine that distributes SPL tokens based on verified watch sessions, creating a sustainable creator-viewer economy.

The product includes a gamification layer with XP, levels, and achievements to drive retention, along with a referral system that rewards users for growing the network. A leaderboard tracks top earners to fuel competition. The SMT token is deployed on Solana devnet with a treasury-managed supply, and the frontend is built on Next.js with Phantom/Solflare wallet support and Supabase for off-chain data.

The codebase already includes a deployed token script, reward engine, session validator, achievement engine, XP engine, wallet-based registration, leaderboard UI, and a video carousel component — all built with AI-assisted development (Claude Code).

**Deadline**
> May 10, 2026 (Asia/Calcutta)

**Proof of Work**

- **GitHub repo**: https://github.com/artomily/samono
- **7 commits** with feature-complete progress: token deployment script, reward engine, session validator, XP/achievement engines, wallet-based registration, referral system, leaderboard, gamification features, and video carousel UI
- **SPL token (SMT)** deployed on Solana devnet with treasury keypair and 1M initial supply
- **Full Next.js frontend** with wallet adapter (Phantom + Solflare), Supabase backend, and Tailwind CSS
- **AI-assisted development** session transcript attached (`claude-session.jsonl`)
- **Database schema** with 6 tables, RLS policies, triggers for streak tracking, auto profile creation, and gamification columns
- **Anti-sybil session validation** with tab-switch detection, speed-change monitoring, active ratio checks, and daily session caps
- **Reward engine** with streak multipliers (up to 2x), level bonuses (+5% per level), and referral bonuses (+10%)

**Personal X Profile**
> x.com/rakaalts

**Personal GitHub Profile**
> github.com/artomily

**Colosseum Crowdedness Score**
> [ACTION NEEDED] Visit https://colosseum.com/copilot to get your project's Crowdedness Score. Take a screenshot, upload to Google Drive, and paste the link here.

**AI Session Transcript**
> Attach `./claude-session.jsonl` (exported to project root)

---

## Step 3: Milestones

**Goals and Milestones**

| # | Milestone | Target Date |
|---|-----------|-------------|
| 1 | Finalize watch-session validation with anti-sybil checks and integrate reward engine with SMT token distributions on devnet | April 29, 2026 |
| 2 | Complete gamification loop — wire XP engine, level progression, and achievement unlocks to the frontend with real-time updates | May 3, 2026 |
| 3 | Launch referral system with on-chain tracking and SMT bounty payouts; build creator dashboard for uploading/managing content | May 6, 2026 |
| 4 | End-to-end testing on devnet — wallet flows, token claims, leaderboard accuracy; polish UI/UX and fix edge cases | May 8, 2026 |
| 5 | Deploy to mainnet, public launch, and begin onboarding first wave of users via referral campaigns | May 10, 2026 |

**Primary KPI**
> 100 daily active wallet-connected users within 2 weeks of launch

**Final tranche checkbox**
> [ ] I understand that to receive the final tranche, I must submit my Colosseum project link, GitHub repo, and AI subscription receipt.

---

## Pre-submission checklist

- [ ] `claude-session.jsonl` attached to the form
- [ ] Colosseum Crowdedness Score screenshot uploaded to Google Drive and linked
- [ ] All fields above copy-pasted into the form at https://superteam.fun/earn/grants/agentic-engineering
