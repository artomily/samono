"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";

import {
  ActivityStream,
  type ActivityStreamExternalEvent,
} from "@/components/ActivityStream";
import {
  SWAP_OPTIONS,
  simulatePointSwap,
  type SwapOption,
} from "@/lib/mock-point-swap";

interface SwapPointsClientProps {
  username: string;
  initialPointsBalance: number;
  initialSolBalance?: number;
}

export function SwapPointsClient({
  username,
  initialPointsBalance,
  initialSolBalance = 0,
}: SwapPointsClientProps) {
  const reduceMotion = useReducedMotion();
  const [pointsBalance, setPointsBalance] = useState(initialPointsBalance);
  const [solBalance, setSolBalance] = useState(initialSolBalance);
  const [activeSwapId, setActiveSwapId] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState("Select a conversion rail to route points into SOL.");
  const [lastSignature, setLastSignature] = useState<string | null>(null);
  const [lastSwapLabel, setLastSwapLabel] = useState<string | null>(null);
  const [successSwapId, setSuccessSwapId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [externalEvents, setExternalEvents] = useState<ActivityStreamExternalEvent[]>([]);

  async function handleSwap(option: SwapOption) {
    if (activeSwapId) return;
    if (pointsBalance < option.pointsCost) return;

    const previousPointsBalance = pointsBalance;
    const previousSolBalance = solBalance;

    setErrorMessage(null);
    setSuccessSwapId(null);
    setActiveSwapId(option.id);
    setLastSignature(null);
    setLastSwapLabel(option.label);
    setLastStatus(`Routing ${option.pointsCost.toLocaleString("en-US")} points into settlement rail...`);
    setPointsBalance((current) => current - option.pointsCost);

    try {
      const result = await simulatePointSwap({
        option,
        currentPointsBalance: previousPointsBalance,
        currentSolBalance: previousSolBalance,
      });

      setPointsBalance(result.nextPointsBalance);
      setSolBalance(result.nextSolBalance);
      setLastStatus(result.successMessage);
      setLastSignature(result.txSignature);
      setSuccessSwapId(option.id);
      setExternalEvents((current) => [...current, ...result.activityEvents]);
      toast.success(result.successMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Swap failed. Try again.";

      setPointsBalance(previousPointsBalance);
      setSolBalance(previousSolBalance);
      setErrorMessage(message);
      setLastStatus("Swap aborted. Points restored to the local balance mirror.");
      toast.error(message);
    } finally {
      setActiveSwapId(null);
    }
  }

  const currentOption = SWAP_OPTIONS.find((option) => option.id === activeSwapId) ?? null;

  return (
    <main className="min-h-screen bg-black px-4 pb-12 pt-24 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="flex flex-col gap-4 border border-white/10 bg-white/3 p-5 md:flex-row md:items-end md:justify-between md:p-7">
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-[0.4em] text-cyan-300/75">
              dashboard / sol conversion
            </div>
            <div className="space-y-2">
              <h1 className="font-mono text-3xl uppercase tracking-[0.18em] text-white sm:text-4xl">
                Swap Points to SOL
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/64">
                Route engagement points into a mocked SOL settlement rail with live status,
                wallet-balance feedback, and synchronized system activity.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="min-h-10 border border-white/12 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-white/72 transition-colors duration-150 ease-out hover:border-cyan-300/60 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Return to Dashboard
            </Link>
            <div className="border border-cyan-400/20 bg-cyan-400/8 px-4 py-2 text-right">
              <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-200/70">
                operator
              </div>
              <div className="font-mono text-sm uppercase tracking-[0.18em] text-cyan-100">
                {username}
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <StatusPanel
            label="Points Balance"
            value={pointsBalance.toLocaleString("en-US")}
            caption="Spendable engagement points"
            accent="text-cyan-200"
          />
          <StatusPanel
            label="Wallet Mirror"
            value={`${solBalance.toFixed(2)} SOL`}
            caption="Mock wallet balance updates on settlement"
            accent="text-emerald-300"
            animatedKey={solBalance}
            reduceMotion={reduceMotion}
          />
          <StatusPanel
            label="Settlement State"
            value={currentOption ? "Processing" : successSwapId ? "Settled" : "Standby"}
            caption={currentOption ? currentOption.etaLabel : "Awaiting next conversion rail"}
            accent={currentOption ? "text-amber-300" : successSwapId ? "text-emerald-300" : "text-fuchsia-300"}
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <section className="border border-white/10 bg-white/3 p-5 md:p-6">
            <div className="flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.34em] text-white/42">
                  swap rails
                </div>
                <h2 className="mt-2 font-mono text-xl uppercase tracking-[0.16em] text-white">
                  Select Conversion Route
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-white/54">
                Each rail simulates confirmation latency, posts a wallet credit, and emits
                synchronized feed events without touching the chain.
              </p>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {SWAP_OPTIONS.map((option, index) => {
                const disabled = Boolean(activeSwapId) || pointsBalance < option.pointsCost;
                const isLoading = activeSwapId === option.id;
                const isSuccess = successSwapId === option.id;

                return (
                  <motion.button
                    key={option.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSwap(option)}
                    initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    transition={
                      reduceMotion
                        ? undefined
                        : { duration: 0.28, ease: [0, 0, 0.2, 1], delay: index * 0.06 }
                    }
                    whileHover={
                      reduceMotion || disabled ? undefined : { y: -4, borderColor: "rgba(103,232,249,0.52)" }
                    }
                    whileTap={reduceMotion || disabled ? undefined : { scale: 0.985 }}
                    className="group min-h-56 border border-white/10 bg-black/50 p-5 text-left transition-colors duration-150 ease-out hover:bg-white/4 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    aria-busy={isLoading}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.32em] text-white/42">
                          {option.label}
                        </div>
                        <div className="mt-3 font-mono text-3xl uppercase tracking-[0.14em] text-white">
                          {option.solAmount.toFixed(2)} SOL
                        </div>
                      </div>
                      <div className="border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-cyan-200/78">
                        {option.etaLabel}
                      </div>
                    </div>

                    <div className="mt-8 flex items-baseline justify-between gap-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.28em] text-white/40">
                          points required
                        </div>
                        <div className="mt-2 font-mono text-2xl text-cyan-100">
                          {option.pointsCost.toLocaleString("en-US")}
                        </div>
                      </div>
                      <div className="text-right text-[11px] uppercase tracking-[0.22em] text-white/48">
                        {pointsBalance >= option.pointsCost ? "eligible" : "insufficient"}
                      </div>
                    </div>

                    <div className="mt-8 border-t border-white/8 pt-4">
                      <div className="text-xs uppercase tracking-[0.28em] text-white/44">
                        {isLoading
                          ? "Processing transaction..."
                          : isSuccess
                            ? `${option.solAmount.toFixed(2)} SOL sent to your wallet`
                            : pointsBalance >= option.pointsCost
                              ? "Click to execute swap"
                              : "Earn more points to unlock"}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-white/46">
                        <span>swap rail</span>
                        <span className="text-white/72">
                          {isLoading ? "routing" : isSuccess ? "settled" : "idle"}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>

          <div className="grid gap-6">
            <section className="border border-white/10 bg-white/3 p-5 md:p-6">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.32em] text-white/42">
                    transaction status
                  </div>
                  <h2 className="mt-2 font-mono text-lg uppercase tracking-[0.16em] text-white">
                    Settlement Monitor
                  </h2>
                </div>
                <div className="text-[10px] uppercase tracking-[0.26em] text-cyan-200/68">
                  {activeSwapId ? "busy" : "ready"}
                </div>
              </div>

              <div className="mt-5 space-y-4 text-sm text-white/68">
                <div className="border border-white/8 bg-black/40 p-4">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-white/42">
                    live status
                  </div>
                  <p className="mt-3 leading-6 text-white/78">{lastStatus}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border border-white/8 bg-black/40 p-4">
                    <div className="text-[10px] uppercase tracking-[0.28em] text-white/42">
                      last route
                    </div>
                    <div className="mt-3 font-mono text-sm uppercase tracking-[0.16em] text-cyan-100">
                      {lastSwapLabel ?? "Awaiting input"}
                    </div>
                  </div>
                  <div className="border border-white/8 bg-black/40 p-4">
                    <div className="text-[10px] uppercase tracking-[0.28em] text-white/42">
                      tx signature
                    </div>
                    <div className="mt-3 font-mono text-sm text-white/78">
                      {lastSignature ? `${lastSignature.slice(0, 8)}...${lastSignature.slice(-8)}` : "Pending"}
                    </div>
                  </div>
                </div>

                {errorMessage ? (
                  <div className="border border-red-400/30 bg-red-500/8 p-4 text-sm leading-6 text-red-100">
                    {errorMessage}
                  </div>
                ) : null}
              </div>
            </section>

            <ActivityStream
              label="LAST ACTIVITY"
              className="border border-white/10 bg-white/3"
              externalEvents={externalEvents}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

interface StatusPanelProps {
  label: string;
  value: string;
  caption: string;
  accent: string;
  animatedKey?: number;
  reduceMotion?: boolean | null;
}

function StatusPanel({
  label,
  value,
  caption,
  accent,
  animatedKey,
  reduceMotion,
}: StatusPanelProps) {
  return (
    <div className="border border-white/10 bg-white/3 p-4 md:p-5">
      <div className="text-[10px] uppercase tracking-[0.32em] text-white/42">{label}</div>
      <div className={`mt-3 font-mono text-2xl uppercase tracking-[0.12em] ${accent}`}>
        {animatedKey === undefined ? (
          value
        ) : (
          <motion.span
            key={animatedKey}
            initial={reduceMotion ? false : { opacity: 0.45, y: 8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={reduceMotion ? undefined : { duration: 0.24, ease: [0, 0, 0.2, 1] }}
            className="inline-block"
          >
            {value}
          </motion.span>
        )}
      </div>
      <p className="mt-3 text-sm leading-6 text-white/52">{caption}</p>
    </div>
  );
}
