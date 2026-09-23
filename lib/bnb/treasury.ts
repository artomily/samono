/**
 * Treasury account loader — SERVER ONLY.
 * Never import this in client components.
 *
 * This account funds every reward payout; it signs (and is the source of)
 * every native BNB transfer. On testnet, fund it from the BSC faucet.
 */
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";

let _treasury: PrivateKeyAccount | null = null;

export function getTreasuryAccount(): PrivateKeyAccount {
  if (_treasury) return _treasury;

  const raw = process.env.TREASURY_PRIVATE_KEY?.trim();
  if (!raw) {
    throw new Error(
      "TREASURY_PRIVATE_KEY env var is not set. Run `npm run setup:bnb` first."
    );
  }

  const key = (raw.startsWith("0x") ? raw : `0x${raw}`) as `0x${string}`;
  try {
    _treasury = privateKeyToAccount(key);
    return _treasury;
  } catch {
    throw new Error(
      "TREASURY_PRIVATE_KEY is malformed. Expected a 32-byte hex private key."
    );
  }
}
