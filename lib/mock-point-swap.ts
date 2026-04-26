import type { ActivityStreamExternalEvent } from "@/components/ActivityStream";

export interface SwapOption {
  id: string;
  pointsCost: number;
  solAmount: number;
  label: string;
  etaLabel: string;
}

export interface SimulatePointSwapInput {
  option: SwapOption;
  currentPointsBalance: number;
  currentSolBalance: number;
}

export interface SimulatePointSwapResult {
  option: SwapOption;
  nextPointsBalance: number;
  nextSolBalance: number;
  successMessage: string;
  activityEvents: ActivityStreamExternalEvent[];
  txSignature: string;
}

export const SWAP_OPTIONS: SwapOption[] = [
  {
    id: "tier-1000",
    pointsCost: 1000,
    solAmount: 0.01,
    label: "ENTRY ROUTE",
    etaLabel: "1.2s avg settlement",
  },
  {
    id: "tier-5000",
    pointsCost: 5000,
    solAmount: 0.05,
    label: "CORE ROUTE",
    etaLabel: "1.5s avg settlement",
  },
  {
    id: "tier-10000",
    pointsCost: 10000,
    solAmount: 0.1,
    label: "MAX ROUTE",
    etaLabel: "1.8s avg settlement",
  },
];

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomSignature() {
  return Array.from({ length: 44 }, () =>
    "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"[
      Math.floor(Math.random() * 58)
    ]
  ).join("");
}

export async function simulatePointSwap({
  option,
  currentPointsBalance,
  currentSolBalance,
}: SimulatePointSwapInput): Promise<SimulatePointSwapResult> {
  if (currentPointsBalance < option.pointsCost) {
    throw new Error("Insufficient points balance for this swap.");
  }

  await wait(1200 + Math.floor(Math.random() * 700));

  const txSignature = randomSignature();
  const nextPointsBalance = currentPointsBalance - option.pointsCost;
  const nextSolBalance = Number((currentSolBalance + option.solAmount).toFixed(4));
  const solDisplay = option.solAmount.toFixed(2);
  const pointsDisplay = option.pointsCost.toLocaleString("en-US");

  return {
    option,
    nextPointsBalance,
    nextSolBalance,
    successMessage: `${solDisplay} SOL sent to your wallet mirror.`,
    txSignature,
    activityEvents: [
      {
        kind: "swap",
        message: `Swap executed — ${solDisplay} SOL`,
      },
      {
        kind: "wallet",
        message: `Wallet credited — ${solDisplay} SOL`,
      },
      {
        kind: "swap",
        message: `User converted ${pointsDisplay} points`,
      },
    ],
  };
}
