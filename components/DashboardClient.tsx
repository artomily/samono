"use client";

import { useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import {
  Zap,
  TrendingUp,
  Flame,
  Eye,
  Copy,
  Check,
  ArrowRight,
  PlayCircle,
  Trophy,
  Users,
  ArrowLeftRight,
} from "lucide-react";
import { VideoCard } from "@/components/VideoCard";
import type { ActivityStreamExternalEvent } from "@/components/ActivityStream";
import { ClaimButton } from "@/components/ClaimButton";

interface Video {
  id: string;
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  durationSeconds: number;
  viewCount: number;
  rewardAmount: number;
}

interface Props {
  username: string;
  userPoints: number;
  totalEarned: number;
  pendingAmount: number;
  watchStreak: number;
  videosWatched: number;
  referralUsername?: string;
  recentActivity: ActivityStreamExternalEvent[];
  videos: Video[];
}

const STATS = [
  {
    key: "userPoints",
    label: "Total Points",
    icon: Zap,
    color: "text-cyan-300",
    borderColor: "border-cyan-300/20",
    glowColor: "rgba(0,229,255,0.08)",
    getValue: (p: Props) => p.userPoints.toLocaleString(),
  },
  {
    key: "totalEarned",
    label: "SOL Earned",
    icon: TrendingUp,
    color: "text-emerald-400",
    borderColor: "border-emerald-400/20",
    glowColor: "rgba(0,255,135,0.06)",
    getValue: (p: Props) => `${p.totalEarned.toFixed(4)} SOL`,
  },
  {
    key: "watchStreak",
    label: "Day Streak",
    icon: Flame,
    color: "text-amber-400",
    borderColor: "border-amber-400/20",
    glowColor: "rgba(251,191,36,0.06)",
    getValue: (p: Props) => `${p.watchStreak}×`,
  },
  {
    key: "videosWatched",
    label: "Videos Watched",
    icon: Eye,
    color: "text-violet-400",
    borderColor: "border-violet-400/20",
    glowColor: "rgba(167,139,250,0.06)",
    getValue: (p: Props) => `${p.videosWatched}`,
  },
] as const;

const QUICK_LINKS = [
  { href: "/watch",           label: "Browse Videos",  icon: PlayCircle    },
  { href: "/leaderboard",    label: "Leaderboard",    icon: Trophy         },
  { href: "/referral",       label: "My Referrals",   icon: Users          },
  { href: "/dashboard/swap", label: "Swap Points",    icon: ArrowLeftRight },
] as const;

export function DashboardClient(props: Props) {
  const { username, pendingAmount, referralUsername, videos } = props;
  const [copied, setCopied] = useState(false);

  const referralUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${referralUsername}`
      : `/register?ref=${referralUsername}`;

  const copyReferral = () => {
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 lg:px-8 pb-16 pt-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ── Welcome bar ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap border-b border-white/8 pb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-cyan-300/45 mb-1 font-mono">
              operator dashboard
            </p>
            <h1 className="text-2xl font-bold font-mono tracking-wider text-white">
              ⊕ {username.toUpperCase()}
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/dashboard/swap"
              className="border border-white/12 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white/65 hover:border-cyan-300/40 hover:text-cyan-300 transition-colors font-mono"
            >
              Swap Points →
            </Link>
            {pendingAmount > 0 && (
              <ClaimButton pendingAmount={pendingAmount} />
            )}
          </div>
        </div>

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATS.map((s, i) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.07 }}
              className={`border ${s.borderColor} bg-white/[0.03] p-4 hover:bg-white/[0.05] transition-colors`}
              style={{ boxShadow: `inset 0 0 40px ${s.glowColor}` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <s.icon className={`h-3.5 w-3.5 ${s.color} shrink-0`} />
                <span className="text-[10px] uppercase tracking-[0.22em] text-white/35 leading-none">
                  {s.label}
                </span>
              </div>
              <div className={`text-2xl font-bold font-mono ${s.color} leading-none`}>
                {s.getValue(props)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Content + Sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-6 items-start">

          {/* Videos panel */}
          <div className="border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-cyan-300/60" />
                <span className="text-[11px] uppercase tracking-[0.26em] text-white/45 font-mono">
                  Available Streams
                </span>
              </div>
              <Link
                href="/watch"
                className="text-[10px] uppercase tracking-[0.18em] text-cyan-300/45 hover:text-cyan-300 transition-colors font-mono flex items-center gap-1"
              >
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {videos.length === 0 ? (
              <div className="border border-white/8 py-16 text-center">
                <PlayCircle className="h-8 w-8 text-white/15 mx-auto mb-3" />
                <p className="text-sm text-white/30 font-mono uppercase tracking-wider">
                  No streams available
                </p>
                <p className="text-xs text-white/20 mt-1">
                  Videos will appear here once synced from YouTube
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {videos.slice(0, 8).map((v) => (
                  <VideoCard
                    key={v.id}
                    id={v.id}
                    youtubeId={v.youtubeId}
                    title={v.title}
                    thumbnailUrl={v.thumbnailUrl}
                    durationSeconds={v.durationSeconds}
                    viewCount={v.viewCount}
                    rewardAmount={v.rewardAmount}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">

            {/* Referral card */}
            {referralUsername && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                className="border border-cyan-300/15 bg-white/[0.03] p-5"
                style={{ boxShadow: "inset 0 0 40px rgba(0,229,255,0.04)" }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Users className="h-3.5 w-3.5 text-cyan-300/60" />
                  <span className="text-[10px] uppercase tracking-[0.26em] text-white/40 font-mono">
                    Referral Link
                  </span>
                </div>
                <p className="text-[11px] text-white/30 mb-3 leading-relaxed">
                  Earn +10% on every stream from users you refer.
                </p>
                <code className="block text-[11px] font-mono text-cyan-300/70 break-all leading-relaxed bg-white/[0.04] px-2.5 py-2 border border-white/8 mb-3">
                  {referralUrl}
                </code>
                <button
                  onClick={copyReferral}
                  className="w-full flex items-center justify-center gap-2 border border-white/10 py-2 text-[11px] uppercase tracking-[0.2em] text-white/45 hover:border-cyan-300/30 hover:text-cyan-300/80 transition-colors font-mono"
                >
                  {copied ? (
                    <><Check className="h-3 w-3 text-emerald-400" /> Copied!</>
                  ) : (
                    <><Copy className="h-3 w-3" /> Copy Link</>
                  )}
                </button>
              </motion.div>
            )}

            {/* Quick actions card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38 }}
              className="border border-white/10 bg-white/[0.03] p-5"
            >
              <span className="text-[10px] uppercase tracking-[0.26em] text-white/35 font-mono block mb-3">
                Quick Actions
              </span>
              <div className="flex flex-col">
                {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center justify-between px-2 py-2.5 text-[12px] text-white/50 hover:bg-white/[0.05] hover:text-white/90 transition-colors group"
                  >
                    <span className="flex items-center gap-2.5 font-mono tracking-wide">
                      <Icon className="h-3.5 w-3.5 text-white/30 group-hover:text-cyan-300/70 transition-colors" />
                      {label}
                    </span>
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                  </Link>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
