/**
 * Treasury keypair loader — SERVER ONLY.
 * Never import this in client components.
 */

import { Keypair } from "@solana/web3.js";

let _treasury: Keypair | null = null;

export function getTreasuryKeypair(): Keypair {
  if (_treasury) return _treasury;

  const raw = process.env.TREASURY_WALLET_KEYPAIR;
  if (!raw) {
    throw new Error(
      "TREASURY_WALLET_KEYPAIR env var is not set. Run `npm run deploy:token` first."
    );
  }

  try {
    const bytes = JSON.parse(raw) as number[];
    _treasury = Keypair.fromSecretKey(Uint8Array.from(bytes));
    return _treasury;
  } catch {
    throw new Error(
      "TREASURY_WALLET_KEYPAIR is malformed. Expected a JSON array of 64 bytes."
    );
  }
}
