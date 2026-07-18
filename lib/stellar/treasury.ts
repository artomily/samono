/**
 * Treasury keypair loader — SERVER ONLY.
 * Never import this in client components.
 *
 * This account funds every reward payout; it signs (and is the source of)
 * every native XLM Payment transaction. On testnet it is funded via Friendbot.
 */

import { Keypair } from "@stellar/stellar-sdk";

let _treasury: Keypair | null = null;

export function getTreasuryKeypair(): Keypair {
  if (_treasury) return _treasury;

  const secret = process.env.TREASURY_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "TREASURY_SECRET_KEY env var is not set. Run `npm run setup:stellar` first."
    );
  }

  try {
    _treasury = Keypair.fromSecret(secret.trim());
    return _treasury;
  } catch {
    throw new Error(
      "TREASURY_SECRET_KEY is malformed. Expected a Stellar secret seed (S…)."
    );
  }
}
