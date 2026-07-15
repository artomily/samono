// Stellar / Soroban-related types for the Samono platform

export interface StellarTokenBalance {
  /** Token contract id, or "SMT" for the Samono Token. */
  contract: string;
  owner: string;
  /** Balance in base units (i128). */
  amount: bigint;
  decimals: number;
  /** Human-readable balance. */
  uiAmount: number;
}

export interface TransferResult {
  success: boolean;
  /** Stellar transaction hash. */
  hash?: string;
  error?: string;
}

export type StellarNetwork = "testnet" | "public" | "futurenet";

export interface WatchSessionHeartbeat {
  sessionId: string;
  activeWatchSeconds: number;
  totalElapsedSeconds: number;
  watchPercentage: number;
  tabSwitchCount: number;
  pauseCount: number;
  speedChangeCount: number;
}

export interface SessionCompletePayload {
  sessionId: string;
  videoId: string;
  activeWatchSeconds: number;
  totalElapsedSeconds: number;
  watchPercentage: number;
  tabSwitchCount: number;
  pauseCount: number;
  speedChangeCount: number;
}

export interface ClaimRewardPayload {
  walletAddress: string;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;
