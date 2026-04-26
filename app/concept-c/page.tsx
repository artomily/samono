"use client";

import { useRef, useEffect, useState } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
} from "motion/react";
import Link from "next/link";
import { useMousePosition } from "@/hooks/useMousePosition";

// ─── Static data ─────────────────────────────────────────────────────────────

const STATS = [
  { value: "12.4K", label: "NODES ACTIVE" },
  { value: "85K", label: "SMT DEPLOYED" },
  { value: "320", label: "STREAMS LIVE" },
  { value: "1.2M", label: "MINS LOGGED" },
];

const STEPS = [
  {
    n: "01",
    label: "SYNC",
    text: "Connect your Solana wallet to establish a node on the network",
  },
  {
    n: "02",
    label: "OBSERVE",
    text: "Engage with curated Web3 content streams across the knowledge graph",
  },
  {
    n: "03",
    label: "HARVEST",
    text: "SMT tokens accumulate per verified engagement minute, automatically",
  },
  {
    n: "04",
    label: "EXTRACT",
    text: "Withdraw on-chain with zero intermediaries, direct to wallet",
  },
];

const NAV_ITEMS = ["NETWORK", "STREAMS", "HARVEST", "NEXUS"] as const;

// ─── Animated orbital ring ────────────────────────────────────────────────────

function OrbitalRing({
  size,
  speed,
  color = "#00E5FF",
  reverse = false,
}: {
  size: number;
  speed: number;
  color?: string;
  reverse?: boolean;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        border: `1px solid ${color}28`,
        top: "50%",
        left: "50%",
        x: "-50%",
        y: "-50%",
      }}
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ repeat: Infinity, duration: speed, ease: "linear" }}
    >
      {/* Orbital dot */}
      <div
        className="absolute rounded-full"
        style={{
          width: 4,
          height: 4,
          background: color,
          boxShadow: `0 0 8px ${color}`,
          top: -2,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />
    </motion.div>
  );
}

// ─── Stat orb with orbital rings ─────────────────────────────────────────────

function StatOrb({
  value,
  label,
  index,
}: {
  value: string;
  label: string;
  index: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      className="relative flex flex-col items-center justify-center"
      style={{ width: 148, height: 148 }}
      initial={{ opacity: 0, scale: 0.55 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{
        type: "spring",
        stiffness: 76,
        damping: 11,
        delay: index * 0.17,
      }}
      whileHover={{ scale: 1.1 }}
    >
      <OrbitalRing size={148} speed={7 + index} />
      <OrbitalRing size={118} speed={4.5 + index * 0.6} reverse color="#FF00AA" />

      <div className="relative z-10 text-center">
        <div
          className="text-2xl font-bold"
          style={{
            color: "#00E5FF",
            textShadow: "0 0 22px rgba(0,229,255,0.55)",
          }}
        >
          {value}
        </div>
        <div
          className="text-xs mt-1 tracking-widest"
          style={{ color: "rgba(0,229,255,0.45)" }}
        >
          {label}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Proximity-reactive panel ─────────────────────────────────────────────────

function ProximityPanel({
  children,
  rotation = 0,
  delay = 0,
}: {
  children: React.ReactNode;
  rotation?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mouse = useMousePosition();
  const [proximity, setProximity] = useState(0);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.sqrt(
      (mouse.x - cx) ** 2 + (mouse.y - cy) ** 2
    );
    setProximity(Math.max(0, 1 - dist / 380));
  }, [mouse.x, mouse.y]);

  return (
    <motion.div
      ref={ref}
      className="relative border p-6"
      style={{
        rotate: rotation,
        borderColor: `rgba(0,229,255,${0.07 + proximity * 0.32})`,
        boxShadow: `0 0 ${28 * proximity}px rgba(0,229,255,${0.14 * proximity}), inset 0 0 ${12 * proximity}px rgba(0,229,255,${0.04 * proximity})`,
        background: `rgba(0,229,255,${0.015 + proximity * 0.038})`,
        transition:
          "border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",
      }}
      initial={{ opacity: 0, scale: 0.94, rotate: rotation - 4 }}
      animate={inView ? { opacity: 1, scale: 1, rotate: rotation } : {}}
      transition={{
        type: "spring",
        stiffness: 76,
        damping: 13,
        delay,
      }}
    >
      {/* Corner accents */}
      <div
        className="absolute top-0 left-0 w-1.5 h-1.5 rounded-full"
        style={{
          background: `rgba(0,229,255,${0.35 + proximity * 0.65})`,
          boxShadow: `0 0 6px rgba(0,229,255,${0.4 + proximity * 0.6})`,
        }}
      />
      <div
        className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full"
        style={{
          background: `rgba(255,0,170,${0.35 + proximity * 0.65})`,
          boxShadow: `0 0 6px rgba(255,0,170,${0.4 + proximity * 0.6})`,
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-1.5 h-1.5 rounded-full"
        style={{
          background: `rgba(255,0,170,${0.25 + proximity * 0.55})`,
          boxShadow: `0 0 6px rgba(255,0,170,${0.3 + proximity * 0.5})`,
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full"
        style={{
          background: `rgba(0,229,255,${0.25 + proximity * 0.55})`,
          boxShadow: `0 0 6px rgba(0,229,255,${0.3 + proximity * 0.5})`,
        }}
      />
      {children}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConceptCPage() {
  const mouse = useMousePosition();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const heroX = useSpring(rawX, { stiffness: 55, damping: 18 });
  const heroY = useSpring(rawY, { stiffness: 55, damping: 18 });

  useEffect(() => {
    rawX.set((mouse.nx - 0.5) * 24);
    rawY.set((mouse.ny - 0.5) * 12);
  }, [mouse.nx, mouse.ny, rawX, rawY]);

  const gridX = (mouse.nx - 0.5) * 22;
  const gridY = (mouse.ny - 0.5) * 22;

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{
        background: "#000000",
        fontFamily: "var(--font-geist-mono), 'Courier New', monospace",
        color: "#00E5FF",
      }}
    >
      {/* ── Animated dot grid ────────────────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,229,255,0.14) 1px, transparent 1px)",
          backgroundSize: "38px 38px",
          backgroundPosition: `${gridX}px ${gridY}px`,
          transition: "background-position 0.28s ease",
        }}
      />

      {/* ── Radial vignette ──────────────────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 75% at 50% 50%, transparent 25%, rgba(0,0,0,0.82) 100%)",
        }}
      />

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <motion.nav
        className="relative z-20 flex items-center justify-between px-8 py-5"
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 110, damping: 16 }}
      >
        <motion.div
          className="text-base font-bold tracking-widest"
          style={{
            color: "#00E5FF",
            textShadow: "0 0 22px rgba(0,229,255,0.55)",
          }}
          whileHover={{ textShadow: "0 0 35px rgba(0,229,255,0.85)" }}
        >
          ⊕ SAMONO
        </motion.div>

        <div className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item, i) => (
            <motion.button
              key={item}
              className="relative text-xs tracking-widest"
              style={{ color: i === 0 ? "#00E5FF" : "rgba(0,229,255,0.38)" }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 14,
                delay: i * 0.07,
              }}
              whileHover={{ color: "#00E5FF", y: -2 }}
            >
              {item}
              {i === 0 && (
                <motion.div
                  className="absolute -bottom-1 left-0 right-0 h-px"
                  style={{ background: "#00E5FF" }}
                />
              )}
            </motion.button>
          ))}
        </div>

        <motion.div
          whileHover={{
            borderColor: "#FF00AA",
            boxShadow: "0 0 18px rgba(255,0,170,0.35)",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          style={{
            border: "1px solid rgba(255,0,170,0.45)",
            display: "inline-block",
          }}
        >
          <Link
            href="/register"
            className="block px-5 py-2 text-xs tracking-widest"
            style={{ color: "#FF00AA" }}
          >
            CONNECT WALLET →
          </Link>
        </motion.div>
      </motion.nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative z-10 px-8 pt-14 pb-20 text-center">
        <motion.div style={{ x: heroX, y: heroY }}>
          <motion.div
            className="text-xs tracking-widest mb-7"
            style={{ color: "rgba(255,0,170,0.62)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            ──── SOLANA REWARD NETWORK · NODE v2.1 ────
          </motion.div>

          <motion.h1
            className="text-7xl md:text-9xl font-bold tracking-tight leading-none"
            style={{
              color: "#00E5FF",
              textShadow:
                "0 0 50px rgba(0,229,255,0.38), 0 0 100px rgba(0,229,255,0.12)",
            }}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 78,
              damping: 13,
              delay: 0.28,
            }}
          >
            WATCH
          </motion.h1>

          <motion.h1
            className="text-7xl md:text-9xl font-bold tracking-tight leading-none"
            style={{
              color: "#FF00AA",
              textShadow:
                "0 0 50px rgba(255,0,170,0.38), 0 0 100px rgba(255,0,170,0.12)",
            }}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 78,
              damping: 13,
              delay: 0.44,
            }}
          >
            EARN
          </motion.h1>

          <motion.p
            className="mt-7 text-sm max-w-md mx-auto leading-relaxed"
            style={{ color: "rgba(0,229,255,0.5)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Engage Web3 content streams. Extract SMT tokens. Direct to wallet.
            No intermediaries. Settled on Solana.
          </motion.p>

          <motion.div
            className="mt-9 flex items-center justify-center gap-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 90, damping: 14, delay: 0.85 }}
          >
            <motion.div
              whileHover={{
                backgroundColor: "rgba(0,229,255,0.1)",
                boxShadow: "0 0 32px rgba(0,229,255,0.42)",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              style={{ border: "2px solid #00E5FF", display: "inline-block" }}
            >
              <Link
                href="/register"
                className="block px-8 py-3.5 text-sm tracking-widest font-bold"
                style={{ color: "#00E5FF" }}
              >
                ENTER NETWORK
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ color: "#FF00AA" }}
              style={{ color: "rgba(255,0,170,0.6)" }}
            >
              <Link
                href="/login"
                className="block px-8 py-3.5 text-sm tracking-widest"
                style={{ color: "inherit" }}
              >
                RECONNECT ↗
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Stats orbs ───────────────────────────────────────────────────── */}
      <div className="relative z-10 py-16">
        <div
          className="text-center text-xs tracking-widest mb-14"
          style={{ color: "rgba(0,229,255,0.28)" }}
        >
          ─── NETWORK TELEMETRY ───
        </div>
        <div className="flex flex-wrap justify-center gap-10 md:gap-16">
          {STATS.map((s, i) => (
            <StatOrb key={s.label} {...s} index={i} />
          ))}
        </div>
      </div>

      {/* ── Protocol steps: proximity panels ─────────────────────────────── */}
      <div className="relative z-10 max-w-4xl mx-auto px-8 py-16">
        <div
          className="text-xs tracking-widest mb-11"
          style={{ color: "rgba(0,229,255,0.28)" }}
        >
          ─── INTEGRATION PROTOCOL
          ────────────────────────────────────────────
        </div>
        <div className="grid sm:grid-cols-2 gap-7">
          {STEPS.map((step, i) => (
            <ProximityPanel
              key={step.n}
              rotation={[-2.2, 1.8, -1.2, 2.5][i]}
              delay={i * 0.14}
            >
              <div
                className="text-xs mb-3"
                style={{ color: "rgba(255,0,170,0.55)" }}
              >
                [{step.n}]
              </div>
              <div
                className="text-lg font-bold tracking-wider mb-2.5"
                style={{ color: "#00E5FF" }}
              >
                {step.label}
              </div>
              <div
                className="text-xs leading-relaxed"
                style={{ color: "rgba(0,229,255,0.5)" }}
              >
                {step.text}
              </div>
            </ProximityPanel>
          ))}
        </div>
      </div>

      {/* ── Footer node ──────────────────────────────────────────────────── */}
      <div
        className="relative z-10 flex items-center justify-center gap-8 py-14 text-xs tracking-widest"
        style={{ color: "rgba(0,229,255,0.2)" }}
      >
        <Link
          href="/concepts"
          className="hover:opacity-60 transition-opacity"
          style={{ color: "rgba(0,229,255,0.35)" }}
        >
          ← BACK TO CONCEPTS
        </Link>
        <span>⊕ SAMONO NETWORK v2.1 ⊕</span>
      </div>
    </div>
  );
}
