// Solana-related types for the Samono platform

export interface SolanaTokenBalance {
  mint: string;
  owner: string;
  amount: bigint;
  decimals: number;
  uiAmount: number;
}

export interface TransferResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export type SolanaNetwork = "devnet" | "testnet" | "mainnet-beta";

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
