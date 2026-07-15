/**
 * Central Stellar / Soroban configuration.
 *
 * The app targets Stellar **testnet** by default. All chain access flows through
 * these values so switching networks is a matter of env vars only.
 */
import { Networks } from "@stellar/stellar-sdk";

export type StellarNetwork = "testnet" | "public" | "futurenet";

export const NETWORK = (process.env.NEXT_PUBLIC_STELLAR_NETWORK ??
  "testnet") as StellarNetwork;

/** Soroban RPC endpoint (server-side reads/writes of contract state). */
export const SOROBAN_RPC_URL =
  process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";

/** Horizon endpoint (classic account/tx queries — optional helpers). */
export const HORIZON_URL =
  process.env.HORIZON_URL ?? "https://horizon-testnet.stellar.org";

/** Network passphrase used when signing transactions. */
export const NETWORK_PASSPHRASE =
  process.env.NETWORK_PASSPHRASE ??
  (NETWORK === "public"
    ? Networks.PUBLIC
    : NETWORK === "futurenet"
      ? Networks.FUTURENET
      : Networks.TESTNET);

/** Deployed Samono Token (SMT) contract id (C…). */
export const SMT_CONTRACT_ID =
  process.env.SMT_CONTRACT_ID ?? process.env.NEXT_PUBLIC_SMT_CONTRACT_ID ?? "";

/** SMT uses 7 decimals (matches the on-chain `decimal` set at deploy). */
export const SMT_DECIMALS = 7;

/** Stellar Expert explorer base for the active network. */
export const EXPLORER_TX_BASE = `https://stellar.expert/explorer/${NETWORK}/tx`;

/** Convert a human amount (e.g. 0.005) to i128 base units as a bigint. */
export function toBaseUnits(amountHuman: number): bigint {
  return BigInt(Math.round(amountHuman * 10 ** SMT_DECIMALS));
}

/** Convert i128 base units (bigint | number | string) to a human amount. */
export function fromBaseUnits(base: bigint | number | string): number {
  return Number(base) / 10 ** SMT_DECIMALS;
}
