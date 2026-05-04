"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { VideoCard } from "@/components/VideoCard";
import { ActivityStream, type ActivityStreamExternalEvent } from "@/components/ActivityStream";
import { ClaimButton } from "@/components/ClaimButton";

const CYAN = "#00E5FF";
const MAGENTA = "#FF00AA";
const GREEN = "#00FF87";
const MONO = "var(--font-geist-mono), 'Courier New', monospace";

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

const STATS_CONFIG = [
  { label: "TOTAL POINTS", getValue: (p: Props) => p.userPoints.toLocaleString(), color: GREEN },
  { label: "TOTAL EARNED", getValue: (p: Props) => `${p.totalEarned.toFixed(2)} SOL`, color: CYAN },
  { label: "PENDING", getValue: (p: Props) => `${p.pendingAmount.toFixed(2)} SOL`, color: MAGENTA },
  { label: "DAY STREAK", getValue: (p: Props) => `${p.watchStreak}×`, color: GREEN },
  { label: "STREAMS WATCHED", getValue: (p: Props) => `${p.videosWatched}`, color: CYAN },
];

export function DashboardClient(props: Props) {
  const { username, pendingAmount, referralUsername, videos } = props;

  return (
    <div style={{ background: "#000", fontFamily: MONO, color: "#fff", minHeight: "100vh" }}>

      {/* ── Header ── */}
      <div style={{
        borderBottom: "1px solid rgba(0,229,255,0.10)",
        padding: "1.4rem 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem",
      }}>
        {/* <div>
          <div style={{ fontSize: "0.6rem", letterSpacing: "0.22em", color: "rgba(0,229,255,0.45)", marginBottom: "0.3rem" }}>
            ─── OPERATOR COMMAND ───
          </div>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "0.06em", color: CYAN }}>
            ⊕ {username.toUpperCase()}
          </h1>
        </div> */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link
            href="/dashboard/swap"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            style={{
              textDecoration: "none",
              border: "1px solid rgba(0,229,255,0.18)",
              color: "rgba(255,255,255,0.78)",
              fontSize: "0.62rem",
              letterSpacing: "0.18em",
              padding: "0.8rem 1rem",
              textTransform: "uppercase",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "rgba(0,229,255,0.6)";
              e.currentTarget.style.color = CYAN;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "rgba(0,229,255,0.18)";
              e.currentTarget.style.color = "rgba(255,255,255,0.78)";
            }}
          >
            SWAP POINTS →
          </Link>
          {pendingAmount > 0 && (
            <div style={{ clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)", boxShadow: `0 0 24px rgba(255,0,170,0.4)` }}>
              <ClaimButton pendingAmount={pendingAmount} />
            </div>
          )}
          </div>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))", borderBottom: "1px solid rgba(0,229,255,0.08)" }}>
        {STATS_CONFIG.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }}
            style={{
              padding: "1.6rem 1.5rem",
              borderRight: i < STATS_CONFIG.length - 1 ? "1px solid rgba(0,229,255,0.08)" : undefined,
            }}>
            <div style={{ fontSize: "0.58rem", letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)", marginBottom: "0.4rem" }}>{s.label}</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 900, color: s.color, letterSpacing: "-0.01em" }}>{s.getValue(props)}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Column Headers ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr min(22rem, 100%)", borderBottom: "1px solid rgba(0,229,255,0.08)" }}>
        <div style={{ padding: "0.75rem 2rem", fontSize: "0.58rem", letterSpacing: "0.2em", color: "rgba(0,229,255,0.45)", borderRight: "1px solid rgba(0,229,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>─── AVAILABLE STREAMS ───</span>
          <Link href="/watch" style={{ fontSize: "0.58rem", letterSpacing: "0.16em", color: "rgba(0,229,255,0.45)", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.color = CYAN)}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(0,229,255,0.45)}")}>
            VIEW ALL →
          </Link>
        </div>
        <div style={{ padding: "0.75rem 2rem", fontSize: "0.58rem", letterSpacing: "0.2em", color: "rgba(0,229,255,0.45)" }}>
          ─── ACTIVITY LOG ───
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr min(22rem, 100%)", gap: "0", minHeight: "60vh" }}>

        {/* Left: Videos */}
        <div style={{ padding: "2rem", borderRight: "1px solid rgba(0,229,255,0.08)" }}>
          {videos.length === 0 ? (
            <div style={{ border: "1px solid rgba(0,229,255,0.15)", padding: "4rem 2rem", textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
              <div style={{ fontSize: "0.75rem", letterSpacing: "0.1em" }}>NO STREAMS AVAILABLE</div>
              <div style={{ fontSize: "0.65rem", marginTop: "0.4rem" }}>Check back soon or contact admin</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(13rem, 1fr))", gap: "1rem" }}>
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

        {/* Right: Activity + Referral */}
        <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
          <ActivityStream
            maxItems={6}
            label=""
            disableAutoGeneration={true}
            externalEvents={props.recentActivity}
          />
          {props.recentActivity.length === 0 && (
            <div style={{ fontSize: "0.65rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", textAlign: "center", padding: "1.5rem 0" }}>
              NO RECENT ACTIVITY
            </div>
          )}

          {referralUsername && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ border: "1px solid rgba(0,229,255,0.18)", padding: "1.4rem" }}>
              <div style={{ fontSize: "0.58rem", letterSpacing: "0.2em", color: CYAN, marginBottom: "0.8rem" }}>─── YOUR REFERRAL LINK ───</div>
              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", marginBottom: "0.6rem" }}>
                EARN +10% ON EVERY REFERRED STREAM
              </div>
              <code style={{ display: "block", fontSize: "0.65rem", color: GREEN, wordBreak: "break-all", letterSpacing: "0.04em", lineHeight: 1.6 }}>
                {typeof window !== "undefined" ? window.location.origin : ""}/register?ref={referralUsername}
              </code>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
