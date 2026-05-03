// ─────────────────────────────────────────────────────────────────
// Swap point tiers — single source of truth for API + UI.
// Earn ~70 pts per typical video (reward_amount=10, 10-min video).
// ENTRY (700 pts) ≈ 10 videos watched.
// ─────────────────────────────────────────────────────────────────

export interface SwapOption {
  id: string;
  pointsCost: number;
  solAmount: number;
  label: string;
  etaLabel: string;
}

export const SWAP_OPTIONS: SwapOption[] = [
  {
    id: "tier-700",
    pointsCost: 700,
    solAmount: 0.01,
    label: "ENTRY ROUTE",
    etaLabel: "~10 videos to unlock",
  },
  {
    id: "tier-3500",
    pointsCost: 3500,
    solAmount: 0.05,
    label: "CORE ROUTE",
    etaLabel: "~50 videos to unlock",
  },
  {
    id: "tier-7000",
    pointsCost: 7000,
    solAmount: 0.10,
    label: "MAX ROUTE",
    etaLabel: "~100 videos to unlock",
  },
];
