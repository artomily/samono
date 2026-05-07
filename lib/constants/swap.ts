// ─────────────────────────────────────────────────────────────────
// Swap point tiers — single source of truth for API + UI.
// Earn ~70 pts per typical video (reward_amount=10, 10-min video).
// ─────────────────────────────────────────────────────────────────

export interface SwapOption {
  id: string;
  pointsCost: number;
  solAmount: number;
  label: string;
  etaLabel: string;
}

export const SWAP_OPTIONS: SwapOption[] = [
  { id: "tier-500",   pointsCost: 500,   solAmount: 0.005, label: "STARTER",  etaLabel: "~7 videos"   },
  { id: "tier-1000",  pointsCost: 1000,  solAmount: 0.010, label: "ENTRY",    etaLabel: "~14 videos"  },
  { id: "tier-2000",  pointsCost: 2000,  solAmount: 0.021, label: "BASIC",    etaLabel: "~28 videos"  },
  { id: "tier-3500",  pointsCost: 3500,  solAmount: 0.038, label: "STANDARD", etaLabel: "~50 videos"  },
  { id: "tier-5000",  pointsCost: 5000,  solAmount: 0.055, label: "PLUS",     etaLabel: "~71 videos"  },
  { id: "tier-7500",  pointsCost: 7500,  solAmount: 0.085, label: "PRO",      etaLabel: "~107 videos" },
  { id: "tier-10000", pointsCost: 10000, solAmount: 0.115, label: "MAX",      etaLabel: "~142 videos" },
  { id: "tier-15000", pointsCost: 15000, solAmount: 0.180, label: "ELITE",    etaLabel: "~214 videos" },
];

