"use client";

import { type MouseEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import Link from "next/link";
import { useMousePosition } from "@/hooks/useMousePosition";
import { OrbitalRing } from "@/components/nexus/OrbitalRing";
import { StatOrb } from "@/components/nexus/StatOrb";
import { Footer } from "@/components/Footer";

// ─── Constants ───────────────────────────────────────────────────────────────

const CYAN = "#00E5FF";
const PINK = "#FF00FF";
const BLUE = "#60A5FA";
const MONO = "var(--font-geist-mono), 'Courier New', monospace";
// Domain belum dibeli — pakai relative path untuk sekarang.
// Setelah apps.samono.com aktif, ganti jadi "https://apps.samono.com"
const APP_URL = "";
// Legacy aliases (backward compat)
const MAGENTA = PINK;
const GREEN = BLUE;

const STATS = [
  { value: "POINTS", label: "EARN PER VIDEO" },
  { value: "SOL", label: "REWARDS ASSET" },
  { value: "10×", label: "VIDEOS TO FIRST SWAP" },
  { value: "∞", label: "REFERRAL EARNINGS" },
];

const USER_FLOW = [
  { n: "01", icon: "◈", title: "CONNECT WALLET", desc: "Phantom, Solflare, or any Wallet Standard adapter. No email, no password. Your key, your account.", color: CYAN },
  { n: "02", icon: "▶", title: "WATCH VIDEOS", desc: "Stream curated Web3 educational content. Every verified view earns engagement points, tracked in real time.", color: BLUE },
  { n: "03", icon: "⊕", title: "EARN POINTS", desc: "Points credit instantly after each video. Daily streak bonuses stack up to 2× multiplier automatically.", color: PINK },
  { n: "04", icon: "◆", title: "CLAIM SOL", desc: "Swap your points for real SOL via the on-chain Anchor program. Sent directly to your connected wallet.", color: CYAN },
];

const PROTOCOL_FLOW = [
  { title: "AD REVENUE", detail: "Main treasury inflow", color: CYAN },
  { title: "TREASURY PDA", detail: "On-chain vault (Solana)", color: BLUE },
  { title: "ANCHOR PROGRAM", detail: "Verified swap contract", color: PINK },
  { title: "YOUR WALLET", detail: "Real SOL delivered", color: CYAN },
];

const TOKEN_TIERS = [
  {
    label: "BASE RATE",
    rate: "POINTS PER VIDEO",
    color: CYAN,
    perks: ["Every completed stream", "Instant queue credit", "Zero minimum runtime"],
  },
  {
    label: "STREAK BONUS",
    rate: "UP TO 2× POINTS",
    color: MAGENTA,
    perks: ["7-day streak: 1.5×", "30-day streak: 2×", "Protected by anti-cheat"],
  },
  {
    label: "REFERRAL",
    rate: "10% LIFETIME",
    color: GREEN,
    perks: ["Earns on every referral stream", "No cap on referrals", "Tracked on-chain"],
  },
];

const TREASURY_INFLOW = [
  { label: "AD REVENUE", value: "~60%", width: 82, color: CYAN },
  { label: "FIAT RAMP", value: "~25%", width: 54, color: MAGENTA },
  { label: "EXTERNAL", value: "~15%", width: 31, color: GREEN },
];

const TREASURY_OUTFLOW = [
  { label: "SOLANA DISTRIBUTION", value: "41%", width: 41, color: CYAN },
  { label: "LIQUIDITY", value: "27%", width: 27, color: MAGENTA },
  { label: "REWARDS BUFFER", value: "18%", width: 18, color: GREEN },
  { label: "OPS RESERVE", value: "14%", width: 14, color: "rgba(255,255,255,0.75)" },
];

const TREASURY_FLOW = [
  { label: "INTAKE", amount: "~60%", color: CYAN, height: 74 },
  { label: "BUFFER", amount: "~12%", color: MAGENTA, height: 48 },
  { label: "DISTRIBUTE", amount: "~41%", color: GREEN, height: 64 },
  { label: "LP", amount: "~10%", color: MAGENTA, height: 36 },
  { label: "VAULT", amount: "~7%", color: CYAN, height: 30 },
];

const WHY_US = [
  { label: "REAL SOL REWARDS", color: CYAN, text: "Every reward converts directly to SOL — Solana's native asset. Not loyalty points, not vouchers. Tradeable, transferable, yours." },
  { label: "ON-CHAIN VERIFICATION", color: MAGENTA, text: "All reward distributions are logged on Solana's blockchain. Every payout is publicly auditable. No black-box systems." },
  { label: "DAILY STREAKS", color: GREEN, text: "Watch consistently and earn streak multipliers up to 2×. A grace period keeps your streak alive if you miss a day." },
  { label: "REFERRAL NETWORK", color: CYAN, text: "Earn 10% of your referrals' rewards for life. No cap on referrals. Bring your network and multiply your income." },
];

const FAQS = [
  { q: "Is Samono free to use?", a: "Yes, completely free. You just need a Solana wallet and an account to start earning." },
  { q: "Which wallets are supported?", a: "Any Solana wallet — Phantom, Solflare, Backpack, Ledger, and more via Wallet Standard." },
  { q: "When do I receive my SOL rewards?", a: "Rewards queue immediately after a video completes. Claim to your wallet any time." },
  { q: "How does the anti-cheat system work?", a: "We monitor tab visibility, playback speed, and interaction patterns. Suspicious activity voids rewards for that session." },
  { q: "What is SOL and where can I use it?", a: "SOL is Solana's native asset. Once claimed, it can be held, transferred, or used anywhere supported in the Solana ecosystem." },
  { q: "Can I earn on mobile?", a: "Yes — fully responsive. Connect your mobile wallet and stream on any device." },
];

// ─── Section heading helper ───────────────────────────────────────────────────

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="text-center" style={{ marginBottom: sub ? "2.5rem" : "3.5rem" }}>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-[0.62rem] tracking-[0.24em] mb-[0.6rem]"
        style={{ color: CYAN }}
      >
        ─── {eyebrow} ───
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        viewport={{ once: true }}
        className="font-black tracking-[-0.01em]"
        style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", margin: sub ? "0 0 0.8rem" : 0 }}
      >
        {title}
      </motion.p>
      {sub && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          viewport={{ once: true }}
          className="text-[0.78rem] text-white/35 tracking-[0.04em] leading-[1.65] max-w-[42rem] mx-auto"
        >
          {sub}
        </motion.p>
      )}
    </div>
  );
}

// ─── How It Works flow diagram ────────────────────────────────────────────────

function HowItWorksFlow() {
  return (
    <div>
      {/* User journey – 4 connected step cards */}
      <div className="grid grid-cols-4 overflow-x-auto">
        {USER_FLOW.map((step, i) => (
          <motion.div
            key={step.n}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            viewport={{ once: true }}
            className="relative min-w-[190px] p-[2rem_1.8rem_2.2rem]"
            style={{
              borderTop: `2px solid ${step.color}`,
              borderLeft: i === 0 ? `1px solid ${step.color}30` : "1px solid rgba(255,255,255,0.07)",
              borderRight: i === USER_FLOW.length - 1 ? `1px solid ${step.color}30` : "none",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              background: `linear-gradient(160deg, ${step.color}06, transparent 60%)`,
            }}
          >
            <div className="text-[0.54rem] tracking-[0.24em] text-white/[0.22] mb-[1.2rem]">
              STEP {step.n}
            </div>
            <div className="text-[1.9rem] mb-[0.9rem] leading-none" style={{ color: step.color, filter: `drop-shadow(0 0 14px ${step.color})` }}>
              {step.icon}
            </div>
            <div className="text-[0.72rem] font-bold tracking-[0.10em] text-white mb-3">
              {step.title}
            </div>
            <p className="text-[0.71rem] text-white/40 leading-[1.7] m-0">
              {step.desc}
            </p>
            {i < USER_FLOW.length - 1 && (
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: i * 0.2 }}
                className="absolute z-[3] text-[1.4rem] leading-none"
                style={{ right: "-14px", top: "2.2rem", color: step.color, filter: `drop-shadow(0 0 6px ${step.color})` }}
              >›</motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Protocol layer label */}
      <div className="text-center relative pt-[1.4rem] pb-[0.8rem]">
        <div aria-hidden className="absolute left-[4%] right-[4%] top-1/2 border-t border-dashed border-white/[0.04]" />
        <span className="bg-black relative z-[1] px-[1.2rem] text-[0.56rem] tracking-[0.26em] text-white/[0.16]">
          ▼ PROTOCOL INFRASTRUCTURE
        </span>
      </div>

      {/* Protocol layer – 4 slim cards */}
      <div className="grid grid-cols-4 overflow-x-auto">
        {PROTOCOL_FLOW.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 + i * 0.08 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 relative min-w-[190px] bg-white/[0.01] p-[1.1rem_1.6rem]"
            style={{
              border: "1px solid rgba(255,255,255,0.07)",
              borderLeft: i === 0 ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(255,255,255,0.07)",
              borderRight: i === PROTOCOL_FLOW.length - 1 ? "1px solid rgba(255,255,255,0.10)" : "none",
            }}
          >
            <div className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: step.color, boxShadow: `0 0 8px ${step.color}` }} />
            <div>
              <div className="text-[0.6rem] font-bold tracking-[0.14em]" style={{ color: step.color }}>{step.title}</div>
              <div className="text-[0.58rem] text-white/[0.26] tracking-[0.07em] mt-[0.18rem]">{step.detail}</div>
            </div>
            {i < PROTOCOL_FLOW.length - 1 && (
              <motion.div
                animate={{ x: [0, 3, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: i * 0.2 }}
                className="absolute z-[3] text-[0.9rem] text-white/[0.22] top-1/2 -translate-y-1/2"
                style={{ right: "-9px" }}
              >›</motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Treasury preview ─────────────────────────────────────────────────────────

function TreasuryPreview() {
  const shellRef = useRef<HTMLDivElement>(null);
  const localX = useMotionValue(0);
  const localY = useMotionValue(0);
  const tiltX = useSpring(localX, { stiffness: 110, damping: 24 });
  const tiltY = useSpring(localY, { stiffness: 110, damping: 24 });

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const node = shellRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;

    localX.set(nx * 8);
    localY.set(ny * 6);
  }

  function handleMouseLeave() {
    localX.set(0);
    localY.set(0);
  }

  return (
    <motion.div
      ref={shellRef}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, amount: 0.2 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "relative",
        maxWidth: "72rem",
        margin: "0 auto",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.2)",
        background: "linear-gradient(180deg, rgba(30,30,30,0.96), rgba(10,10,10,0.96))",
        backdropFilter: "blur(10px)",
        overflow: "hidden",
        boxShadow: "0 20px 64px rgba(0,0,0,0.55), 0 0 44px rgba(0,229,255,0.05)",
      }}
    >
      <motion.div
        aria-hidden
        animate={{ opacity: [0.14, 0.22, 0.16] }}
        transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 20% 0%, rgba(0,229,255,0.08), transparent 34%), radial-gradient(circle at 82% 100%, rgba(255,0,255,0.08), transparent 28%)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        aria-hidden
        animate={{ y: ["-10%", "110%"] }}
        transition={{ repeat: Infinity, duration: 4.6, ease: "linear" }}
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.04), transparent)",
          pointerEvents: "none",
          mixBlendMode: "screen",
        }}
      />

      <motion.div
        aria-hidden
        animate={{ opacity: [0.92, 0.84, 0.94, 0.88, 0.93] }}
        transition={{ repeat: Infinity, duration: 0.45, ease: "easeInOut", repeatDelay: 2.8 }}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "100% 5px",
          opacity: 0.12,
        }}
      />

      <motion.div
        style={{
          x: tiltX,
          y: tiltY,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "grid",
            gap: "0.7rem",
            padding: "0.9rem 1rem 0.8rem",
            borderBottom: "1px solid rgba(255,255,255,0.14)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "999px", background: "#FF5F57", boxShadow: "0 0 12px rgba(255,95,87,0.4)" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "999px", background: "#FEBC2E", boxShadow: "0 0 12px rgba(254,188,46,0.38)" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "999px", background: "#28C840", boxShadow: "0 0 12px rgba(40,200,64,0.38)" }} />
            </div>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.18em", color: "rgba(255,255,255,0.55)" }}>
              TREASURY WINDOW
            </div>
            <motion.div
              animate={{ opacity: [0.55, 1, 0.55] }}
              transition={{ repeat: Infinity, duration: 1.7, ease: "easeInOut" }}
              style={{ color: CYAN, fontSize: "0.56rem", letterSpacing: "0.16em" }}
            >
              MOUSE INTERACTIVE
            </motion.div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.35rem",
              overflowX: "auto",
              paddingBottom: "0.1rem",
            }}
          >
            {[
              { label: "OVERVIEW", active: true },
              { label: "INFLOW", active: false },
              { label: "OUTFLOW", active: false },
              { label: "FLOW MAP", active: false },
            ].map((tab) => (
              <div
                key={tab.label}
                style={{
                  fontSize: "0.55rem",
                  letterSpacing: "0.16em",
                  color: tab.active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
                  border: tab.active ? "1px solid rgba(0,229,255,0.35)" : "1px solid rgba(255,255,255,0.14)",
                  background: tab.active ? "rgba(0,229,255,0.08)" : "rgba(255,255,255,0.04)",
                  borderRadius: "10px 10px 0 0",
                  padding: "0.5rem 0.8rem",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {tab.label}
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "1.4rem 1.2rem 1.2rem" }}>
          <div style={{ marginBottom: "1.4rem" }}>
            <div style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.02em", color: CYAN, marginBottom: "0.65rem" }}>
              OBSERVE THE FLOW
            </div>
            <p style={{ maxWidth: "44rem", fontSize: "0.78rem", lineHeight: 1.7, color: "rgba(255,255,255,0.42)", letterSpacing: "0.05em" }}>
              A preview of Samono’s on-chain treasury system. All flows will be verifiable.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))", gap: "1rem" }}>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div style={{ border: "1px solid rgba(0,229,255,0.12)", background: "rgba(0,0,0,0.26)", padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.9rem", fontSize: "0.6rem", letterSpacing: "0.18em", color: CYAN }}>
                  <span>INFLOW</span>
                  <span>ADSENSE / FIAT / EXTERNAL</span>
                </div>
                <div style={{ display: "grid", gap: "0.8rem" }}>
                  {TREASURY_INFLOW.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.45, delay: index * 0.08 }}
                      viewport={{ once: true }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.35rem", letterSpacing: "0.1em" }}>
                        <span>{item.label}</span>
                        <span style={{ color: item.color }}>{item.value}</span>
                      </div>
                      <div style={{ height: "7px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", overflow: "hidden" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.width}%` }}
                          transition={{ duration: 0.8, delay: 0.15 + index * 0.08 }}
                          viewport={{ once: true }}
                          style={{
                            height: "100%",
                            background: item.color,
                            boxShadow: `0 0 18px ${item.color}`,
                          }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div style={{ border: "1px solid rgba(255,0,255,0.16)", background: "rgba(0,0,0,0.24)", padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.9rem", fontSize: "0.6rem", letterSpacing: "0.18em", color: MAGENTA }}>
                  <span>OUTFLOW</span>
                  <span>DISTRIBUTION / LIQUIDITY / REWARDS</span>
                </div>
                <div style={{ display: "grid", gap: "0.8rem" }}>
                  {TREASURY_OUTFLOW.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.45, delay: index * 0.08 }}
                      viewport={{ once: true }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.35rem", letterSpacing: "0.1em" }}>
                        <span>{item.label}</span>
                        <span style={{ color: item.color }}>{item.value}</span>
                      </div>
                      <div style={{ height: "7px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", overflow: "hidden" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.width}%` }}
                          transition={{ duration: 0.8, delay: 0.15 + index * 0.08 }}
                          viewport={{ once: true }}
                          style={{
                            height: "100%",
                            background: item.color,
                            boxShadow: `0 0 18px ${item.color}`,
                          }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ border: "1px solid rgba(0,229,255,0.12)", background: "rgba(0,0,0,0.26)", padding: "1rem", display: "grid", gridTemplateRows: "auto 1fr auto", minHeight: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", fontSize: "0.6rem", letterSpacing: "0.18em", color: CYAN }}>
                <span>FLOW VISUALIZATION</span>
                <span>PREVIEW MODE</span>
              </div>

              <div style={{ display: "flex", alignItems: "end", gap: "0.7rem", minHeight: "16rem", padding: "0.6rem 0.1rem 0.3rem", borderBottom: "1px solid rgba(0,229,255,0.10)", position: "relative" }}>
                {TREASURY_FLOW.map((bar, index) => (
                  <div key={bar.label} style={{ flex: 1, display: "grid", alignItems: "end", justifyItems: "center", gap: "0.5rem" }}>
                    <motion.div
                      animate={{ opacity: [0.75, 1, 0.82] }}
                      transition={{ repeat: Infinity, duration: 2 + index * 0.25, ease: "easeInOut" }}
                      style={{
                        width: "100%",
                        maxWidth: "4rem",
                        height: `${bar.height * 2.2}px`,
                        border: `1px solid ${bar.color}55`,
                        background: `linear-gradient(to top, ${bar.color}55, rgba(0,0,0,0.04))`,
                        boxShadow: `0 0 24px ${bar.color}25`,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <motion.div
                        aria-hidden
                        animate={{ y: [24, -24] }}
                        transition={{ repeat: Infinity, duration: 1.8 + index * 0.2, ease: "linear" }}
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.18), transparent)",
                        }}
                      />
                    </motion.div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.6rem", letterSpacing: "0.14em", color: "rgba(255,255,255,0.56)", marginBottom: "0.2rem" }}>{bar.label}</div>
                      <div style={{ fontSize: "0.64rem", color: bar.color }}>{bar.amount}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ paddingTop: "0.8rem", display: "grid", gap: "0.35rem", fontSize: "0.62rem", letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)" }}>
                <div>LEDGER STATE: <span style={{ color: CYAN }}>PENDING MIRROR</span></div>
                <div>SETTLEMENT TARGET: <span style={{ color: GREEN }}>SOLANA MAINNET</span></div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const mouse = useMousePosition();

  // Email waitlist state
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [waitlistError, setWaitlistError] = useState("");

  async function handleWaitlist(e: FormEvent) {
    e.preventDefault();
    setWaitlistStatus("loading");
    setWaitlistError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: waitlistEmail }),
      });
      if (res.ok) {
        setWaitlistStatus("success");
      } else if (res.status === 409) {
        setWaitlistStatus("error");
        setWaitlistError("This email is already on the waitlist.");
      } else {
        setWaitlistStatus("error");
        setWaitlistError("Something went wrong. Please try again.");
      }
    } catch {
      setWaitlistStatus("error");
      setWaitlistError("Network error. Please try again.");
    }
  }

  // Spring-based parallax for hero
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 76, damping: 18 });
  const springY = useSpring(rawY, { stiffness: 76, damping: 18 });

  // Dot-grid parallax effect
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    rawX.set((mouse.nx - 0.5) * 28);
    rawY.set((mouse.ny - 0.5) * 28);
  }, [mouse.nx, mouse.ny, rawX, rawY]);

  return (
    <div className="bg-black text-white overflow-x-hidden" style={{ fontFamily: MONO }}>

      {/* ── Nav ── */}
      <nav
        className="fixed z-50 left-1/2 -translate-x-1/2 flex items-center justify-between px-[1.4rem] h-[3.2rem]"
        style={{
          top: "0.9rem",
          width: "calc(100% - 2.5rem)",
          maxWidth: "56rem",
          border: "1px solid rgba(0,229,255,0.12)",
          background: "rgba(0,0,0,0.88)",
          backdropFilter: "blur(14px)",
          boxShadow: "0 4px 32px rgba(0,0,0,0.6)",
        }}
      >
        <span className="font-bold tracking-[0.14em] shrink-0" style={{ color: CYAN, textShadow: `0 0 18px rgba(0,229,255,0.35)` }}>SAMONO</span>
        <div className="flex gap-[1.6rem] items-center">
          <Link
            href="/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold no-underline inline-block"
            style={{
              clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
              background: MAGENTA, color: "#000", fontSize: "0.65rem",
              letterSpacing: "0.12em", padding: "0.4rem 1.1rem",
              fontFamily: MONO,
            }}
          >
            LAUNCH APP
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden" style={{ paddingTop: "3.2rem" }}>
        {/* dot-grid background */}
        <div ref={gridRef} aria-hidden className="absolute inset-0 z-0">
          <motion.div
            className="absolute"
            style={{
              inset: "-5%",
              backgroundImage: "radial-gradient(circle, rgba(0,229,255,0.13) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              x: springX, y: springY,
            }}
          />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 55% at 50% 50%, transparent 40%, #000 95%)" }} />
        </div>

        {/* radial glow */}
        <div aria-hidden className="absolute inset-0 z-[1] pointer-events-none" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 30%, rgba(0,229,255,0.04), transparent)` }} />

        <div className="relative z-[2] text-center max-w-[52rem] px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-block mb-[2.2rem] text-[0.65rem] tracking-[0.2em]"
            style={{ border: `1px solid rgba(0,229,255,0.22)`, padding: "0.2rem 0.9rem", color: CYAN }}
          >
            ◈ POWERED BY SOLANA
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="font-black leading-[0.95] tracking-[-0.02em] mb-[1.6rem]"
            style={{ fontSize: "clamp(3rem, 9vw, 7rem)" }}
          >
            <span className="text-white">WATCH</span>
            <br />
            <span style={{ color: CYAN, textShadow: `0 0 60px rgba(0,229,255,0.3)` }}>EARN</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.25 }}
            className="text-white/45 text-[0.88rem] tracking-[0.08em] leading-[1.7] max-w-[34rem] mx-auto mb-[2.6rem]"
          >
            THE FIRST WATCH-TO-EARN PROTOCOL THAT TURNS EDUCATIONAL CRYPTO CONTENT INTO REAL SOL REWARDS — FRAUD-PROOF, ON-CHAIN, VERIFIABLE.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}
            className="flex gap-4 justify-center flex-wrap items-center"
          >
            <Link href="/dashboard" target="_blank" rel="noopener noreferrer" className="font-black no-underline inline-block" style={{
              clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)",
              boxShadow: `0 0 32px rgba(0,229,255,0.22)`,
              background: CYAN, color: "#000",
              fontSize: "0.75rem", letterSpacing: "0.14em",
              padding: "0.75rem 2.2rem",
              fontFamily: MONO,
            }}>START EARNING</Link>
            <Link href={`${APP_URL}/watch`} className="font-bold no-underline" style={{
              border: `1px solid rgba(0,229,255,0.26)`, color: CYAN, fontSize: "0.75rem",
              letterSpacing: "0.14em", padding: "0.75rem 2.2rem",
              clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)",
            }}>BROWSE STREAMS</Link>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-20 px-8 border-t border-white/[0.05]">
        <div className="max-w-[64rem] mx-auto grid gap-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))" }}>
          {STATS.map((s, i) => <StatOrb key={s.label} value={s.value} label={s.label} index={i} />)}
        </div>
      </section>

      {/* ── Video ── */}
      <section className="py-20 px-8 border-t border-white/[0.05]">
        <div className="max-w-[64rem] mx-auto">
          <motion.h2
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5 }}
            className="text-center text-[0.65rem] tracking-[0.22em] mb-[0.6rem]"
            style={{ color: CYAN }}
          >
            ─── SEE IT IN ACTION ───
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center text-[1.8rem] font-black mb-12 tracking-[-0.01em]"
          >
            WATCH THE OVERVIEW
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            viewport={{ once: true, amount: 0.2 }}
            style={{
              position: "relative",
              width: "100%",
              paddingBottom: "56.25%",
              border: "1px solid rgba(0,229,255,0.14)",
              boxShadow: "0 0 48px rgba(0,229,255,0.05), 0 20px 48px rgba(0,0,0,0.5)",
              background: "#000",
            }}
          >
            <iframe
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
              src="https://www.youtube-nocookie.com/embed/v1ZQlVMlG2c?rel=0&modestbranding=1"
              title="Samono — Watch to Earn Protocol Overview"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 px-8 border-t border-white/[0.05]">
        <div className="max-w-[72rem] mx-auto">
          <SectionHead
            eyebrow="HOW IT WORKS"
            title="FOUR STEPS TO SOL"
            sub="From wallet connect to real SOL in your account — powered by an on-chain Anchor program on Solana."
          />
          <HowItWorksFlow />
        </div>
      </section>

      {/* ── Why Us ── */}
      <section className="py-20 px-8 border-t border-white/[0.05]">
        <div className="max-w-[64rem] mx-auto">
          <motion.h2
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5 }}
            className="text-center text-[0.65rem] tracking-[0.22em] mb-[0.6rem]"
            style={{ color: CYAN }}
          >
            ─── WHY SAMONO ───
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center text-[1.8rem] font-black mb-14 tracking-[-0.01em]"
          >
            BUILT DIFFERENT
          </motion.p>
          <div className="grid grid-cols-2 gap-6">
            {WHY_US.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative overflow-hidden p-[2rem_1.6rem]"
                style={{ border: `1px solid ${item.color}33` }}
              >
                <div aria-hidden className="absolute top-0 left-0 right-0 h-[2px] opacity-70" style={{ background: item.color }} />
                <div className="text-[0.6rem] tracking-[0.2em] mb-[0.9rem]" style={{ color: item.color }}>{item.label}</div>
                <p className="text-[0.78rem] text-white/50 leading-[1.7]">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Treasury Preview ── */}
      <section className="py-20 px-8 border-t border-white/[0.05]">
        <TreasuryPreview />
      </section>

      {/* ── Token Tiers ── */}
      <section className="py-20 px-8 border-t border-white/[0.05]">
        <div className="max-w-[64rem] mx-auto">
          <motion.h2
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5 }}
            className="text-center text-[0.65rem] tracking-[0.22em] mb-[0.6rem]"
            style={{ color: CYAN }}
          >
            ─── TOKEN ECONOMICS ───
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center text-[1.8rem] font-black mb-14 tracking-[-0.01em]"
          >
            MAXIMIZE SOL YIELD
          </motion.p>
          <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))" }}>
            {TOKEN_TIERS.map((t, i) => (
              <motion.div
                key={t.label}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative overflow-hidden p-[2rem_1.6rem]"
                style={{ border: `1px solid ${t.color}33` }}
              >
                <div aria-hidden className="absolute top-0 left-0 right-0 h-[2px] opacity-70" style={{ background: t.color }} />
                <div className="text-[0.6rem] tracking-[0.2em] mb-2" style={{ color: t.color }}>{t.label}</div>
                <div className="text-[1.6rem] font-black text-white mb-[1.4rem] tracking-[-0.01em]">{t.rate}</div>
                <ul className="list-none p-0 m-0 flex flex-col gap-[0.55rem]">
                  {t.perks.map(p => (
                    <li key={p} className="flex gap-[0.6rem] items-start text-[0.75rem] text-white/50">
                      <span className="shrink-0" style={{ color: t.color }}>&#8250;</span>{p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Early Access ── */}
      <section className="py-20 px-8 border-t border-white/[0.05]">
        <div className="max-w-[36rem] mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5 }}
            className="text-[0.65rem] tracking-[0.22em] mb-[0.6rem]"
            style={{ color: CYAN }}
          >
            ─── EARLY ACCESS ───
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[1.8rem] font-black mb-4 tracking-[-0.01em]"
          >
            JOIN THE WAITLIST
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.15 }}
            className="text-[0.8rem] text-white/40 tracking-[0.06em] leading-[1.7] mb-10"
          >
            TESTNET &amp; MAINNET LAUNCH. WE WILL INFORM YOU. NO SPAM. UNSUBSCRIBE ANY TIME.
          </motion.p>
          {waitlistStatus === "success" ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              className="text-[0.8rem] tracking-[0.1em] p-[1.4rem_2rem]"
              style={{ border: `1px solid ${GREEN}44`, color: GREEN }}
            >
              ◈ EMAIL SENT — WE WILL INFORM YOU AT TESTNET &amp; MAINNET LAUNCH
            </motion.div>
          ) : (
            <form onSubmit={handleWaitlist} className="flex flex-col gap-[0.9rem]">
              <div className="flex border" style={{ borderColor: "rgba(0,229,255,0.24)" }}>
                <input
                  type="email"
                  required
                  placeholder="YOUR@EMAIL.COM"
                  value={waitlistEmail}
                  onChange={e => setWaitlistEmail(e.target.value)}
                  disabled={waitlistStatus === "loading"}
                  className="flex-1 border-none outline-none text-white text-[0.75rem] tracking-[0.08em] p-[0.8rem_1.2rem]"
                  style={{ background: "rgba(0,0,0,0.6)", fontFamily: MONO }}
                />
                <button
                  type="submit"
                  disabled={waitlistStatus === "loading"}
                  className="font-black text-black text-[0.7rem] tracking-[0.14em] p-[0.8rem_1.6rem] border-0 whitespace-nowrap"
                  style={{
                    background: waitlistStatus === "loading" ? "rgba(0,229,255,0.5)" : CYAN,
                    cursor: waitlistStatus === "loading" ? "not-allowed" : "pointer",
                    fontFamily: MONO,
                  }}
                >
                  {waitlistStatus === "loading" ? "QUEUING..." : "JOIN WAITLIST"}
                </button>
              </div>
              {waitlistStatus === "error" && (
                <p className="text-[0.7rem] tracking-[0.08em] m-0" style={{ color: MAGENTA }}>{waitlistError}</p>
              )}
            </form>
          )}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-8 border-t border-white/[0.05]">
        <div className="max-w-[64rem] mx-auto">
          <motion.h2
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5 }}
            className="text-center text-[0.65rem] tracking-[0.22em] mb-[0.6rem]"
            style={{ color: CYAN }}
          >
            ─── KNOWLEDGE BASE ───
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center text-[1.8rem] font-black mb-14 tracking-[-0.01em]"
          >
            INTERROGATE THE SYSTEM
          </motion.p>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(22rem, 1fr))" }}>
            {FAQS.map((f, i) => (
              <motion.div
                key={f.q}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: i * 0.07 }}
                className="border border-white/[0.07] p-[1.4rem_1.6rem]"
              >
                <p className="text-[0.78rem] font-bold tracking-[0.04em] mb-2" style={{ color: CYAN }}>{f.q}</p>
                <p className="text-[0.75rem] text-white/45 leading-[1.65]">{f.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}
