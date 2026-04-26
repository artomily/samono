"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventKind = "node" | "reward" | "stream" | "wallet" | "sync" | "shield" | "swap";

export interface ActivityStreamExternalEvent {
  kind: EventKind;
  message: string;
  prefix?: string;
  accent?: string;
  ts?: number;
}

interface StreamEvent {
  id: string;
  kind: EventKind;
  prefix: string;
  message: string;
  accent: string;
  ts: number;
}

const EVENT_STYLES: Record<EventKind, { prefix: string; accent: string }> = {
  node: { prefix: "[NODE]", accent: "#00E5FF" },
  reward: { prefix: "[+]", accent: "#00FF87" },
  stream: { prefix: "[•]", accent: "#FF00AA" },
  wallet: { prefix: "[W]", accent: "#00E5FF" },
  sync: { prefix: "[↻]", accent: "rgba(0,229,255,0.6)" },
  shield: { prefix: "[✕]", accent: "#FF6B00" },
  swap: { prefix: "[$]", accent: "#FF00AA" },
};

export function createActivityStreamEvent(event: ActivityStreamExternalEvent): StreamEvent {
  const defaults = EVENT_STYLES[event.kind];

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    kind: event.kind,
    prefix: event.prefix ?? defaults.prefix,
    message: event.message,
    accent: event.accent ?? defaults.accent,
    ts: event.ts ?? Date.now(),
  };
}

// ─── Event templates ──────────────────────────────────────────────────────────

const TEMPLATES: {
  kind: EventKind;
  prefix: string;
  accent: string;
  messages: string[];
}[] = [
  {
    kind: "node",
    prefix: "[NODE]",
    accent: "#00E5FF",
    messages: [
      "New observer node connected · 0x{addr}",
      "Node sync complete · epoch {n}",
      "Relay handshake acknowledged · peer {addr}",
      "Node {addr} joined the reward graph",
    ],
  },
  {
    kind: "reward",
    prefix: "[+]",
    accent: "#00FF87",
    messages: [
      "{n} SOL distributed · wallet 0x{addr}",
      "Reward batch settled on-chain · {n} SOL",
      "Streak multiplier activated · {n}× applied",
      "Claimable balance updated · +{n} SOL",
    ],
  },
  {
    kind: "stream",
    prefix: "[•]",
    accent: "#FF00AA",
    messages: [
      'Content stream indexed · "{title}"',
      "Stream verified complete · {n} observers",
      "New feed segment available · {n} min",
      "Engagement confirmed · {n} nodes active",
    ],
  },
  {
    kind: "wallet",
    prefix: "[W]",
    accent: "#00E5FF",
    messages: [
      "Wallet 0x{addr} authenticated",
      "On-chain transfer finalized · sig {addr}",
      "SPL balance synced · 0x{addr}",
      "Wallet reconnected · {addr}",
    ],
  },
  {
    kind: "sync",
    prefix: "[↻]",
    accent: "rgba(0,229,255,0.6)",
    messages: [
      "Chain state synced · slot {n}",
      "Validator checkpoint confirmed · #{n}",
      "Mempool flushed · {n} pending txs",
      "RPC latency nominal · {n}ms",
    ],
  },
  {
    kind: "shield",
    prefix: "[✕]",
    accent: "#FF6B00",
    messages: [
      "Anomaly detected · session voided · 0x{addr}",
      "Speed-tamper flagged · reward blocked",
      "Tab-switch pattern intercepted · {addr}",
      "Anti-cheat layer engaged · trace {addr}",
    ],
  },
  {
    kind: "swap",
    prefix: "[$]",
    accent: "#FF00AA",
    messages: [
      "Swap executed — {amount} SOL",
      "User converted {points} points",
      "Conversion queue settled — {amount} SOL",
      "Swap rail confirmed · {points} pts → {amount} SOL",
    ],
  },
];

const CONTENT_TITLES = [
  "DeFi Fundamentals Vol.3",
  "Solana Architecture Deep Dive",
  "NFT Market Mechanics",
  "Web3 Security Masterclass",
  "On-Chain Governance 101",
];

// Irregular firing interval pool — deliberately non-uniform
const INTERVAL_POOL = [1400, 2100, 900, 3200, 1700, 2600, 800, 1300, 2900] as const;
let poolCursor = 0;

function nextInterval(): number {
  const v = INTERVAL_POOL[poolCursor % INTERVAL_POOL.length];
  poolCursor++;
  return v;
}

function rHex(len = 6) {
  return Math.random().toString(16).slice(2, 2 + len).toUpperCase();
}
function rInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEvent(): StreamEvent {
  const tpl = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
  const raw = tpl.messages[Math.floor(Math.random() * tpl.messages.length)];
  const message = raw
    .replace("{addr}", rHex())
    .replace("{n}", String(rInt(1, 999)))
    .replace("{points}", String(rInt(500, 10000)))
    .replace("{amount}", (rInt(1, 10) / 100).toFixed(2))
    .replace("{title}", CONTENT_TITLES[Math.floor(Math.random() * CONTENT_TITLES.length)]);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    kind: tpl.kind,
    prefix: tpl.prefix,
    message,
    accent: tpl.accent,
    ts: Date.now(),
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ActivityStreamProps {
  maxItems?: number;
  label?: string;
  className?: string;
  externalEvents?: ActivityStreamExternalEvent[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActivityStream({
  maxItems = 6,
  label = "LIVE NETWORK ACTIVITY",
  className = "",
  externalEvents = [],
}: ActivityStreamProps) {
  const [events, setEvents] = useState<StreamEvent[]>(() =>
    Array.from({ length: 3 }, generateEvent)
  );
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const processedExternalCountRef = useRef(0);

  // Keep ref in sync so the closure inside scheduleNext sees fresh value
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const scheduleNext = useCallback(() => {
    timerRef.current = setTimeout(() => {
      if (!pausedRef.current) {
        setEvents((prev) => [generateEvent(), ...prev].slice(0, maxItems));
      }
      scheduleNext();
    }, nextInterval());
  }, [maxItems]);

  useEffect(() => {
    scheduleNext();
    return () => {
      if (timerRef.current !== undefined) clearTimeout(timerRef.current);
    };
  }, [scheduleNext]);

  useEffect(() => {
    if (externalEvents.length <= processedExternalCountRef.current) return;

    const nextEvents = externalEvents
      .slice(processedExternalCountRef.current)
      .map(createActivityStreamEvent)
      .reverse();

    setEvents((prev) => [...nextEvents, ...prev].slice(0, maxItems));
    processedExternalCountRef.current = externalEvents.length;
  }, [externalEvents, maxItems]);

  return (
    <div className={className}>
      {/* Header */}
      <div
        className="flex items-center justify-between mb-3 text-xs tracking-widest"
        style={{ color: "rgba(0,229,255,0.32)" }}
      >
        <span>{label}</span>
        <motion.span
          animate={{ opacity: paused ? 1 : [1, 0.3, 1] }}
          transition={
            paused
              ? {}
              : { repeat: Infinity, duration: 1.6, ease: "easeInOut" }
          }
          style={{ color: paused ? "rgba(255,107,0,0.7)" : "rgba(0,255,135,0.65)" }}
        >
          {paused ? "⏸ PAUSED" : "● LIVE"}
        </motion.span>
      </div>

      {/* Stream list */}
      <div
        className="relative overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {events.map((evt) => (
          <EventRow key={evt.id} event={evt} />
        ))}

        {/* Bottom mask softens the last row edge during layout animations */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-8"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.86) 75%, rgba(0,0,0,0.97) 100%)",
            boxShadow: "inset 0 -14px 20px rgba(0,0,0,0.45)",
          }}
        />
      </div>
    </div>
  );
}

// ─── Individual event row ─────────────────────────────────────────────────────

function EventRow({ event }: { event: StreamEvent }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        opacity: { type: "spring", stiffness: 220, damping: 24 },
        scale: { type: "spring", stiffness: 260, damping: 26 },
        y: { type: "spring", stiffness: 240, damping: 22 },
      }}
      className="flex items-start gap-2.5 py-2 px-3 border-b cursor-default select-none"
      style={{
        borderColor: hovered
          ? `${event.accent}30`
          : "rgba(0,229,255,0.07)",
        background: hovered ? `${event.accent}09` : "transparent",
        boxShadow: hovered ? `inset 0 0 14px ${event.accent}0c` : "none",
        transition:
          "border-color 0.13s ease, background 0.13s ease, box-shadow 0.13s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Prefix */}
      <span
        className="text-xs font-bold shrink-0 mt-0.5 font-mono tracking-tight"
        style={{ color: event.accent, minWidth: "3.2rem" }}
      >
        {event.prefix}
      </span>

      {/* Message */}
      <span
        className="text-xs leading-relaxed font-mono break-all flex-1"
        style={{
          color: hovered ? "rgba(255,255,255,0.75)" : "rgba(0,229,255,0.48)",
          transition: "color 0.12s ease",
        }}
      >
        {event.message}
      </span>

      {/* Timestamp */}
      <span
        className="text-xs shrink-0 ml-2 mt-0.5 font-mono"
        style={{ color: "rgba(0,229,255,0.2)" }}
      >
        {new Date(event.ts).toLocaleTimeString("en", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })}
      </span>
    </motion.div>
  );
}
