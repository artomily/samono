"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useWallet } from "@solana/wallet-adapter-react";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, Zap, Wallet } from "lucide-react";
import { SWAP_OPTIONS, type SwapOption } from "@/lib/constants/swap";

interface SwapPointsClientProps {
  username: string;
  initialPointsBalance: number;
  initialSolBalance?: number;
}

const CYAN = "#00E5FF";
const MONO = "var(--font-geist-mono), 'Courier New', monospace";

// Color accent per tier index
const TIER_COLORS = [CYAN, CYAN, CYAN, CYAN, CYAN, CYAN, CYAN, CYAN];

export function SwapPointsClient({
  username,
  initialPointsBalance,
  initialSolBalance = 0,
}: SwapPointsClientProps) {
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? null;

  const [pointsBalance, setPointsBalance] = useState(initialPointsBalance);
  const [solBalance, setSolBalance] = useState(initialSolBalance);
  const [pendingOption, setPendingOption] = useState<SwapOption | null>(null);
  const [swapping, setSwapping] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<{ label: string; solAmount: number } | null>(null);

  useEffect(() => {
    fetch("/api/rewards/balance")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.balance === "number") setSolBalance(data.balance);
      })
      .catch(() => {});
  }, []);

  async function handleConfirmSwap() {
    if (!pendingOption || swapping) return;
    const option = pendingOption;

    setSwapping(true);
    setSwapError(null);

    const prevPoints = pointsBalance;
    const prevSol = solBalance;
    setPointsBalance((p) => p - option.pointsCost);

    try {
      const res = await fetch("/api/rewards/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId: option.id }),
      });

      const json = await res.json() as {
        success: boolean;
        error?: string;
        data?: {
          newPointsBalance: number;
          solAmount: number;
          txSignature?: string;
          message: string;
        };
      };

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Swap failed. Please try again.");
      }

      const { data } = json;
      setPointsBalance(data!.newPointsBalance);
      setSolBalance((prev) => Number((prev + data!.solAmount).toFixed(4)));
      setLastSuccess({ label: option.label, solAmount: data!.solAmount });
      setPendingOption(null);
      toast.success(`${data!.solAmount.toFixed(3)} SOL sent to your wallet`);
    } catch (err) {
      setPointsBalance(prevPoints);
      setSolBalance(prevSol);
      setSwapError(err instanceof Error ? err.message : "Swap failed. Please try again.");
    } finally {
      setSwapping(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        fontFamily: MONO,
        color: "#fff",
        padding: "6rem 1.5rem 4rem",
      }}
    >
      <div style={{ maxWidth: "56rem", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.65rem",
              letterSpacing: "0.18em",
              color: "rgba(0,229,255,0.5)",
              textDecoration: "none",
              marginBottom: "1.5rem",
            }}
          >
            <ArrowLeft style={{ width: "0.8rem", height: "0.8rem" }} />
            DASHBOARD
          </Link>

          <h1
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              fontWeight: 900,
              letterSpacing: "0.04em",
              marginBottom: "0.5rem",
            }}
          >
            SWAP POINTS
          </h1>
          <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em" }}>
            Convert engagement points into real SOL. Select a tier below.
          </p>
        </div>

        {/* Balance strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1px",
            background: "rgba(0,229,255,0.05)",
            border: "1px solid rgba(0,229,255,0.1)",
            marginBottom: "2.5rem",
          }}
        >
          <div style={{ background: "#000", padding: "1.1rem 1.4rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.6rem",
                letterSpacing: "0.2em",
                color: "rgba(0,229,255,0.5)",
                marginBottom: "0.4rem",
              }}
            >
              <Zap style={{ width: "0.7rem", height: "0.7rem" }} />
              POINTS BALANCE
            </div>
            <div
              style={{
                fontSize: "1.6rem",
                fontWeight: 900,
                color: CYAN,
                letterSpacing: "-0.01em",
              }}
            >
              {pointsBalance.toLocaleString("en-US")}
            </div>
          </div>
          <div style={{ background: "#000", padding: "1.1rem 1.4rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.6rem",
                letterSpacing: "0.2em",
                color: "rgba(0,229,255,0.5)",
                marginBottom: "0.4rem",
              }}
            >
              <Wallet style={{ width: "0.7rem", height: "0.7rem" }} />
              SOL BALANCE
            </div>
            <div
              style={{
                fontSize: "1.6rem",
                fontWeight: 900,
                color: CYAN,
                letterSpacing: "-0.01em",
              }}
            >
              {solBalance.toFixed(4)}{" "}
              <span style={{ fontSize: "0.9rem", color: "rgba(0,229,255,0.5)" }}>SOL</span>
            </div>
          </div>
        </div>

        {/* Last success banner */}
        <AnimatePresence>
          {lastSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                border: "1px solid rgba(0,229,255,0.25)",
                background: "rgba(0,229,255,0.05)",
                padding: "0.8rem 1.2rem",
                marginBottom: "1.8rem",
                fontSize: "0.72rem",
                letterSpacing: "0.08em",
                color: CYAN,
              }}
            >
              <CheckCircle2 style={{ width: "1rem", height: "1rem", flexShrink: 0 }} />
              {lastSuccess.label} swap complete — {lastSuccess.solAmount.toFixed(3)} SOL sent to your wallet
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(12rem, 1fr))",
            gap: "1rem",
          }}
        >
          {SWAP_OPTIONS.map((option, i) => {
            const color = TIER_COLORS[i] ?? CYAN;
            const canAfford = pointsBalance >= option.pointsCost;

            return (
              <motion.button
                key={option.id}
                type="button"
                disabled={!canAfford}
                onClick={() => {
                  setSwapError(null);
                  setPendingOption(option);
                }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                whileHover={canAfford ? { y: -3 } : undefined}
                whileTap={canAfford ? { scale: 0.97 } : undefined}
                style={{
                  background: "#000",
                  border: `1px solid ${canAfford ? `${color}33` : "rgba(255,255,255,0.06)"}`,
                  padding: "1.4rem 1.2rem",
                  textAlign: "left",
                  cursor: canAfford ? "pointer" : "not-allowed",
                  opacity: canAfford ? 1 : 0.4,
                  position: "relative",
                  overflow: "hidden",
                  fontFamily: MONO,
                }}
              >
                {/* Top accent */}
                {canAfford && (
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "2px",
                      background: color,
                      opacity: 0.6,
                    }}
                  />
                )}

                <div
                  style={{
                    fontSize: "0.58rem",
                    letterSpacing: "0.22em",
                    color: canAfford ? color : "rgba(255,255,255,0.3)",
                    marginBottom: "0.8rem",
                  }}
                >
                  {option.label}
                </div>

                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 900,
                    color: canAfford ? "#fff" : "rgba(255,255,255,0.4)",
                    letterSpacing: "-0.01em",
                    marginBottom: "0.25rem",
                  }}
                >
                  {option.solAmount.toFixed(3)}
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 400,
                      color: canAfford ? color : "rgba(255,255,255,0.25)",
                      marginLeft: "0.3rem",
                    }}
                  >
                    SOL
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "rgba(255,255,255,0.35)",
                    marginBottom: "1.2rem",
                  }}
                >
                  {option.pointsCost.toLocaleString("en-US")}{" "}
                  <span style={{ fontSize: "0.62rem", letterSpacing: "0.1em" }}>PTS</span>
                </div>

                <div
                  style={{
                    fontSize: "0.58rem",
                    letterSpacing: "0.14em",
                    color: "rgba(255,255,255,0.2)",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    paddingTop: "0.8rem",
                  }}
                >
                  {option.etaLabel}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Hint */}
        <p
          style={{
            marginTop: "2rem",
            fontSize: "0.65rem",
            color: "rgba(255,255,255,0.18)",
            letterSpacing: "0.08em",
          }}
        >
          Grayed-out tiers require more points. Watch more videos or use referral bonuses to unlock them.
        </p>
      </div>

      {/* ── Review Modal ── */}
      <AnimatePresence>
        {pendingOption && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!swapping) setPendingOption(null); }}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.8)",
                backdropFilter: "blur(4px)",
                zIndex: 100,
              }}
            />

            {/* Dialog */}
            <motion.div
              key="dialog"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 101,
                width: "calc(100vw - 2rem)",
                maxWidth: "26rem",
                background: "#000",
                border: "1px solid rgba(0,229,255,0.2)",
                padding: "1.8rem",
                fontFamily: MONO,
              }}
            >
              {/* Top accent */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "2px",
                  background: CYAN,
                  opacity: 0.6,
                }}
              />

              <div
                style={{
                  fontSize: "0.6rem",
                  letterSpacing: "0.25em",
                  color: "rgba(255,102,0,0.5)",
                  marginBottom: "0.6rem",
                }}
              >
                ─── REVIEW SWAP ───
              </div>
              <h2
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 900,
                  letterSpacing: "0.04em",
                  marginBottom: "1.6rem",
                }}
              >
                {pendingOption.label} TIER
              </h2>

              {/* Details grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1px",
                  background: "rgba(255,255,255,0.06)",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ background: "#000", padding: "1rem" }}>
                  <div
                    style={{
                      fontSize: "0.58rem",
                      letterSpacing: "0.2em",
                      color: "rgba(255,255,255,0.3)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    YOU SPEND
                  </div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 900, color: CYAN }}>
                    {pendingOption.pointsCost.toLocaleString("en-US")}
                  </div>
                  <div
                    style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(255,102,0,0.4)" }}
                  >
                    POINTS
                  </div>
                </div>
                <div style={{ background: "#000", padding: "1rem" }}>
                  <div
                    style={{
                      fontSize: "0.58rem",
                      letterSpacing: "0.2em",
                      color: "rgba(255,255,255,0.3)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    YOU RECEIVE
                  </div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 900, color: CYAN }}>
                    {pendingOption.solAmount.toFixed(3)}
                  </div>
                  <div
                    style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: "rgba(0,229,255,0.4)" }}
                  >
                    SOL
                  </div>
                </div>
              </div>

              {/* Wallet */}
              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.07)",
                  padding: "0.8rem 1rem",
                  marginBottom: "1.2rem",
                }}
              >
                <div
                  style={{
                    fontSize: "0.58rem",
                    letterSpacing: "0.2em",
                    color: "rgba(255,255,255,0.3)",
                    marginBottom: "0.4rem",
                  }}
                >
                  DESTINATION
                </div>
                {walletAddress ? (
                  <div
                    style={{
                      fontSize: "0.68rem",
                      color: "rgba(255,255,255,0.55)",
                      wordBreak: "break-all",
                    }}
                  >
                    {walletAddress.slice(0, 20)}…{walletAddress.slice(-12)}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.68rem", color: "rgba(255,180,0,0.7)" }}>
                    No wallet connected — SOL sent to registered address
                  </div>
                )}
              </div>

              {/* Rate */}
              <div
                style={{
                  fontSize: "0.62rem",
                  letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.2)",
                  marginBottom: "1.6rem",
                }}
              >
                RATE:{" "}
                <span style={{ color: "rgba(255,255,255,0.4)" }}>
                  {(pendingOption.solAmount / pendingOption.pointsCost * 1000).toFixed(4)} SOL per 1,000 pts
                </span>
              </div>

              {/* Error */}
              {swapError && (
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "flex-start",
                    border: "1px solid rgba(255,80,80,0.3)",
                    background: "rgba(255,80,80,0.06)",
                    padding: "0.7rem 0.9rem",
                    marginBottom: "1.2rem",
                    fontSize: "0.7rem",
                    color: "#fca5a5",
                  }}
                >
                  <AlertCircle style={{ width: "1rem", height: "1rem", flexShrink: 0, marginTop: "0.05rem" }} />
                  {swapError}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "0.7rem" }}>
                <button
                  disabled={swapping}
                  onClick={() => { if (!swapping) { setPendingOption(null); setSwapError(null); } }}
                  style={{
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "transparent",
                    padding: "0.75rem",
                    fontSize: "0.65rem",
                    letterSpacing: "0.2em",
                    color: "rgba(255,255,255,0.4)",
                    fontFamily: MONO,
                    cursor: swapping ? "not-allowed" : "pointer",
                    opacity: swapping ? 0.4 : 1,
                  }}
                >
                  CANCEL
                </button>
                <button
                  disabled={swapping}
                  onClick={handleConfirmSwap}
                  style={{
                    border: `1px solid ${CYAN}44`,
                    background: `${CYAN}10`,
                    padding: "0.75rem",
                    fontSize: "0.65rem",
                    letterSpacing: "0.2em",
                    color: CYAN,
                    fontFamily: MONO,
                    cursor: swapping ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  {swapping && <Loader2 className="animate-spin" style={{ width: "0.85rem", height: "0.85rem" }} />}
                  {swapping ? "SWAPPING…" : "CONFIRM SWAP"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
