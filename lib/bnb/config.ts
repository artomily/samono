/**
 * Central BNB Smart Chain configuration.
 *
 * The app targets BSC **testnet** (chainId 97) by default. Set
 * NEXT_PUBLIC_BNB_NETWORK=mainnet to switch to BSC mainnet (chainId 56).
 */
import { bsc, bscTestnet } from "viem/chains";

export type BnbNetwork = "testnet" | "mainnet";

export const NETWORK = (process.env.NEXT_PUBLIC_BNB_NETWORK ??
  "testnet") as BnbNetwork;

export const CHAIN = NETWORK === "mainnet" ? bsc : bscTestnet;

/** JSON-RPC endpoint used by the server for balances + payouts. */
export const RPC_URL =
  process.env.BNB_RPC_URL ?? CHAIN.rpcUrls.default.http[0];

/** Native BNB uses 18 decimals (1 BNB = 10^18 wei). */
export const BNB_DECIMALS = 18;

/** BscScan explorer base for the active network. */
export const EXPLORER_BASE =
  NETWORK === "mainnet" ? "https://bscscan.com" : "https://testnet.bscscan.com";
export const EXPLORER_TX_BASE = `${EXPLORER_BASE}/tx`;
export const EXPLORER_ADDRESS_BASE = `${EXPLORER_BASE}/address`;

/** EVM address format (0x + 40 hex chars). */
export const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
