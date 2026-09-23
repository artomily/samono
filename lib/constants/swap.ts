// ─────────────────────────────────────────────────────────────────
// Swap point tiers — single source of truth for API + UI.
// Earn ~70 pts per typical video (reward_amount=10, 10-min video).
// `bnbAmount` is the amount of native BNB sent per tier.
// ─────────────────────────────────────────────────────────────────

export interface SwapOption {
  id: string;
  pointsCost: number;
  bnbAmount: number;
  label: string;
  etaLabel: string;
}

export const SWAP_OPTIONS: SwapOption[] = [
  { id: "tier-500",   pointsCost: 500,   bnbAmount: 0.0005, label: "STARTER",  etaLabel: "~7 videos"   },
  { id: "tier-1000",  pointsCost: 1000,  bnbAmount: 0.0010, label: "ENTRY",    etaLabel: "~14 videos"  },
  { id: "tier-2000",  pointsCost: 2000,  bnbAmount: 0.0021, label: "BASIC",    etaLabel: "~28 videos"  },
  { id: "tier-3500",  pointsCost: 3500,  bnbAmount: 0.0038, label: "STANDARD", etaLabel: "~50 videos"  },
  { id: "tier-5000",  pointsCost: 5000,  bnbAmount: 0.0055, label: "PLUS",     etaLabel: "~71 videos"  },
  { id: "tier-7500",  pointsCost: 7500,  bnbAmount: 0.0085, label: "PRO",      etaLabel: "~107 videos" },
  { id: "tier-10000", pointsCost: 10000, bnbAmount: 0.0115, label: "MAX",      etaLabel: "~142 videos" },
  { id: "tier-15000", pointsCost: 15000, bnbAmount: 0.0180, label: "ELITE",    etaLabel: "~214 videos" },
];

