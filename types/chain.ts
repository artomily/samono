// Chain-related types for the Samono platform (BNB Smart Chain)

export interface TokenBalance {
  /** Asset identifier — "native" for BNB. */
  contract: string;
  owner: string;
  /** Balance in base units (wei). */
  amount: bigint;
  decimals: number;
  /** Human-readable balance. */
  uiAmount: number;
}

export interface TransferResult {
  success: boolean;
  /** BNB Chain transaction hash. */
  hash?: string;
  error?: string;
}

export type BnbNetwork = "testnet" | "mainnet";

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
