/**
 * Central Stellar configuration.
 *
 * The app targets Stellar **testnet** by default. All chain access flows through
 * these values so switching networks is a matter of env vars only.
 */
import { Networks } from "@stellar/stellar-sdk";

export type StellarNetwork = "testnet" | "public" | "futurenet";

export const NETWORK = (process.env.NEXT_PUBLIC_STELLAR_NETWORK ??
  "testnet") as StellarNetwork;

/** Horizon endpoint (classic account/tx queries + native XLM payments). */
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

/** Native lumens always use 7 decimal places (1 XLM = 10,000,000 stroops). */
export const XLM_DECIMALS = 7;

/** Stellar Expert explorer base for the active network. */
export const EXPLORER_TX_BASE = `https://stellar.expert/explorer/${NETWORK}/tx`;

/** Convert a human amount (e.g. 0.005) to stroops as a bigint. */
export function toBaseUnits(amountHuman: number): bigint {
  return BigInt(Math.round(amountHuman * 10 ** XLM_DECIMALS));
}

/** Convert stroops (bigint | number | string) to a human amount. */
export function fromBaseUnits(base: bigint | number | string): number {
  return Number(base) / 10 ** XLM_DECIMALS;
}
