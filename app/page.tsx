"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import Link from "next/link";
import { useMousePosition } from "@/hooks/useMousePosition";
import { OrbitalRing } from "@/components/nexus/OrbitalRing";
import { StatOrb } from "@/components/nexus/StatOrb";
import { ProximityPanel } from "@/components/nexus/ProximityPanel";
import { ActivityStream } from "@/components/ActivityStream";

// ─── Constants ───────────────────────────────────────────────────────────────

const CYAN = "#00E5FF";
const MAGENTA = "#FF00AA";
const GREEN = "#00FF87";
const MONO = "var(--font-geist-mono), 'Courier New', monospace";

const STATS = [
  { value: "12.4K", label: "NODES ACTIVE" },
  { value: "85K", label: "SMT DEPLOYED" },
  { value: "320", label: "STREAMS LIVE" },
  { value: "1.2M", label: "MINS LOGGED" },
];

const STEPS = [
  { n: "01", label: "SYNC", text: "Connect your Solana wallet — Phantom, Solflare, or any Wallet Standard adapter. Zero signup friction." },
  { n: "02", label: "OBSERVE", text: "Engage with curated Web3 content. Every verified minute of watch time generates a session heartbeat." },
  { n: "03", label: "HARVEST", text: "SMT tokens accumulate per verified session. Streak multipliers up to 2× stack automatically on-chain." },
  { n: "04", label: "EXTRACT", text: "Withdraw on-chain with zero intermediaries. Your rewards are verifiable by anyone, any time." },
];

const TOKEN_TIERS = [
  {
    label: "BASE RATE",
    rate: "1 SMT / MIN",
    color: CYAN,
    perks: ["Every completed stream", "Instant queue credit", "Zero minimum runtime"],
  },
  {
    label: "STREAK BONUS",
    rate: "UP TO 2× SMT",
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

const FAQS = [
  { q: "Is Samono free to use?", a: "Yes, completely free. You just need a Solana wallet and an account to start earning." },
  { q: "Which wallets are supported?", a: "Any Solana wallet — Phantom, Solflare, Backpack, Ledger, and more via Wallet Standard." },
  { q: "When do I receive my SMT tokens?", a: "Rewards queue immediately after a video completes. Claim to your wallet any time." },
  { q: "How does the anti-cheat system work?", a: "We monitor tab visibility, playback speed, and interaction patterns. Suspicious activity voids rewards for that session." },
  { q: "What is SMT and where can I trade it?", a: "SMT is our Solana SPL token. Trade it on any Solana DEX (Jupiter, Raydium) once you've claimed." },
  { q: "Can I earn on mobile?", a: "Yes — fully responsive. Connect your mobile wallet and stream on any device." },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const mouse = useMousePosition();

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
    <div style={{ background: "#000", fontFamily: MONO, color: "#fff", overflowX: "hidden" }}>

      {/* ── Nav ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        borderBottom: "1px solid rgba(0,229,255,0.10)",
        background: "rgba(0,0,0,0.82)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2rem", height: "3.2rem",
      }}>
        <span style={{ color: CYAN, fontWeight: 700, letterSpacing: "0.14em", textShadow: `0 0 18px rgba(0,229,255,0.5)` }}>⊕ SAMONO</span>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          {[["STREAMS", "/watch"], ["LEADERBOARD", "/leaderboard"], ["REFERRAL", "/referral"]].map(([label, href]) => (
            <Link key={href} href={href} style={{ color: "rgba(0,229,255,0.45)", fontSize: "0.7rem", letterSpacing: "0.16em", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = CYAN)}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(0,229,255,0.45)")}>
              {label}
            </Link>
          ))}
          <Link href="/register" style={{
            background: MAGENTA, color: "#000", fontWeight: 700, fontSize: "0.68rem",
            letterSpacing: "0.12em", padding: "0.3rem 1rem", textDecoration: "none",
            clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
          }}>CONNECT</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: "3.2rem", overflow: "hidden" }}>
        {/* dot-grid background */}
        <div ref={gridRef} aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <motion.div style={{
            position: "absolute", inset: "-5%",
            backgroundImage: "radial-gradient(circle, rgba(0,229,255,0.18) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            x: springX, y: springY,
          }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 55% at 50% 50%, transparent 40%, #000 95%)" }} />
        </div>

        {/* radial glow */}
        <div aria-hidden style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 50% at 50% 30%, rgba(0,229,255,0.06), transparent)`, zIndex: 1 }} />

        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: "52rem", padding: "0 2rem" }}>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            style={{ display: "inline-block", border: `1px solid rgba(0,229,255,0.3)`, padding: "0.2rem 0.9rem", marginBottom: "2.2rem", fontSize: "0.65rem", letterSpacing: "0.2em", color: CYAN }}>
            ◈ POWERED BY SOLANA
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            style={{ fontSize: "clamp(3rem, 9vw, 7rem)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.02em", marginBottom: "1.6rem" }}>
            <span style={{ color: "#fff" }}>WATCH</span>
            <br />
            <span style={{ color: CYAN, textShadow: `0 0 60px rgba(0,229,255,0.4)` }}>EARN</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.25 }}
            style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.88rem", letterSpacing: "0.08em", lineHeight: 1.7, maxWidth: "34rem", margin: "0 auto 2.6rem" }}>
            THE FIRST WATCH-TO-EARN PROTOCOL THAT TURNS EDUCATIONAL CRYPTO CONTENT INTO REAL SMT TOKENS — FRAUD-PROOF, ON-CHAIN, VERIFIABLE.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}
            style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{
              background: CYAN, color: "#000", fontWeight: 700, fontSize: "0.75rem",
              letterSpacing: "0.14em", padding: "0.75rem 2.2rem", textDecoration: "none",
              clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)",
              boxShadow: `0 0 32px rgba(0,229,255,0.35)`,
            }}>INITIALIZE NODE</Link>
            <Link href="/watch" style={{
              border: `1px solid rgba(0,229,255,0.35)`, color: CYAN, fontWeight: 700, fontSize: "0.75rem",
              letterSpacing: "0.14em", padding: "0.75rem 2.2rem", textDecoration: "none",
              clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)",
            }}>BROWSE STREAMS</Link>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ padding: "5rem 2rem", borderTop: "1px solid rgba(0,229,255,0.08)" }}>
        <div style={{ maxWidth: "64rem", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))", gap: "2rem" }}>
          {STATS.map((s, i) => <StatOrb key={s.label} value={s.value} label={s.label} index={i} />)}
        </div>
      </section>

      {/* ── Protocol Steps ── */}
      <section style={{ padding: "5rem 2rem", borderTop: "1px solid rgba(0,229,255,0.08)" }}>
        <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5 }}
            style={{ textAlign: "center", fontSize: "0.65rem", letterSpacing: "0.22em", color: CYAN, marginBottom: "0.6rem" }}>
            ─── PROTOCOL SEQUENCE ───
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ textAlign: "center", fontSize: "1.8rem", fontWeight: 900, marginBottom: "3.5rem", letterSpacing: "-0.01em" }}>
            FOUR STEPS TO EARN
          </motion.p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))", gap: "1.5rem" }}>
            {STEPS.map((s, i) => (
              <ProximityPanel key={s.n} rotation={[-2.2, 1.8, -1.2, 2.5][i]} delay={i * 0.12}>
                <div style={{ padding: "0.2rem" }}>
                  <div style={{ fontSize: "0.6rem", letterSpacing: "0.2em", color: MAGENTA, marginBottom: "0.6rem" }}>{s.n}</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "0.1em", color: CYAN, marginBottom: "0.8rem" }}>{s.label}</div>
                  <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>{s.text}</p>
                </div>
              </ProximityPanel>
            ))}
          </div>
        </div>
      </section>

      {/* ── Activity Stream ── */}
      <section style={{ padding: "5rem 2rem", borderTop: "1px solid rgba(0,229,255,0.08)" }}>
        <div style={{ maxWidth: "44rem", margin: "0 auto" }}>
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5 }}
            style={{ textAlign: "center", fontSize: "0.65rem", letterSpacing: "0.22em", color: CYAN, marginBottom: "0.6rem" }}>
            ─── NETWORK TELEMETRY ───
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ textAlign: "center", fontSize: "1.8rem", fontWeight: 900, marginBottom: "3rem", letterSpacing: "-0.01em" }}>
            LIVE ACTIVITY
          </motion.p>
          <ActivityStream maxItems={7} />
        </div>
      </section>

      {/* ── Token Tiers ── */}
      <section style={{ padding: "5rem 2rem", borderTop: "1px solid rgba(0,229,255,0.08)" }}>
        <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5 }}
            style={{ textAlign: "center", fontSize: "0.65rem", letterSpacing: "0.22em", color: CYAN, marginBottom: "0.6rem" }}>
            ─── TOKEN ECONOMICS ───
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ textAlign: "center", fontSize: "1.8rem", fontWeight: 900, marginBottom: "3.5rem", letterSpacing: "-0.01em" }}>
            MAXIMIZE SMT YIELD
          </motion.p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))", gap: "1.5rem" }}>
            {TOKEN_TIERS.map((t, i) => (
              <motion.div key={t.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{ border: `1px solid ${t.color}33`, padding: "2rem 1.6rem", position: "relative", overflow: "hidden" }}>
                <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: t.color, opacity: 0.7 }} />
                <div style={{ fontSize: "0.6rem", letterSpacing: "0.2em", color: t.color, marginBottom: "0.5rem" }}>{t.label}</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#fff", marginBottom: "1.4rem", letterSpacing: "-0.01em" }}>{t.rate}</div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                  {t.perks.map(p => (
                    <li key={p} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
                      <span style={{ color: t.color, flexShrink: 0 }}>›</span>{p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: "5rem 2rem", borderTop: "1px solid rgba(0,229,255,0.08)" }}>
        <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5 }}
            style={{ textAlign: "center", fontSize: "0.65rem", letterSpacing: "0.22em", color: CYAN, marginBottom: "0.6rem" }}>
            ─── KNOWLEDGE BASE ───
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ textAlign: "center", fontSize: "1.8rem", fontWeight: 900, marginBottom: "3.5rem", letterSpacing: "-0.01em" }}>
            INTERROGATE THE SYSTEM
          </motion.p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(22rem, 1fr))", gap: "1rem" }}>
            {FAQS.map((f, i) => (
              <motion.div key={f.q} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: i * 0.07 }}
                style={{ border: "1px solid rgba(0,229,255,0.15)", padding: "1.4rem 1.6rem" }}>
                <p style={{ fontSize: "0.78rem", fontWeight: 700, color: CYAN, letterSpacing: "0.04em", marginBottom: "0.5rem" }}>{f.q}</p>
                <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>{f.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "6rem 2rem", borderTop: "1px solid rgba(0,229,255,0.08)", textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
          style={{ maxWidth: "38rem", margin: "0 auto" }}>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.22em", color: CYAN, marginBottom: "0.6rem" }}>─── READY TO CONNECT ───</div>
          <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 900, marginBottom: "1.2rem", letterSpacing: "-0.01em" }}>
            INITIALIZE YOUR NODE
          </h2>
          <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", lineHeight: 1.7, marginBottom: "2.5rem" }}>
            JOIN 12,400+ OPERATORS. FREE, INSTANT, EVERY REWARD VERIFIABLE ON-CHAIN.
          </p>
          <Link href="/register" style={{
            display: "inline-block", background: CYAN, color: "#000", fontWeight: 900,
            fontSize: "0.85rem", letterSpacing: "0.14em", padding: "0.9rem 3rem", textDecoration: "none",
            clipPath: "polygon(14px 0%, 100% 0%, calc(100% - 14px) 100%, 0% 100%)",
            boxShadow: `0 0 48px rgba(0,229,255,0.4)`,
          }}>CREATE FREE ACCOUNT</Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid rgba(0,229,255,0.10)", padding: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <span style={{ color: CYAN, fontWeight: 700, letterSpacing: "0.14em", fontSize: "0.82rem" }}>⊕ SAMONO</span>
        <div style={{ display: "flex", gap: "1.8rem" }}>
          {[["STREAMS", "/watch"], ["LEADERBOARD", "/leaderboard"], ["REGISTER", "/register"], ["LOGIN", "/login"]].map(([label, href]) => (
            <Link key={href} href={href} style={{ color: "rgba(0,229,255,0.35)", fontSize: "0.65rem", letterSpacing: "0.16em", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = CYAN)}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(0,229,255,0.35)")}>
              {label}
            </Link>
          ))}
        </div>
        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.65rem", letterSpacing: "0.1em" }}>© {new Date().getFullYear()} SAMONO. BUILT ON SOLANA.</span>
      </footer>
    </div>
  );
}
