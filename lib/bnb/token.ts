/**
 * Native BNB payments — SERVER ONLY.
 *
 * Rewarding a user = a plain native BNB transfer from the treasury account to
 * their wallet on BNB Smart Chain. The treasury must hold enough BNB to cover
 * payouts plus gas.
 */
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  getAddress,
  http,
  isAddress,
  parseEther,
  type PublicClient,
} from "viem";
import { getTreasuryAccount } from "./treasury";
import { CHAIN, RPC_URL, BNB_DECIMALS } from "./config";
import type { TransferResult, TokenBalance } from "@/types/chain";

let _public: PublicClient | null = null;
function getPublicClient(): PublicClient {
  if (!_public) {
    _public = createPublicClient({ chain: CHAIN, transport: http(RPC_URL) });
  }
  return _public;
}

/**
 * Send `amountHuman` BNB to an address. Waits for 1 confirmation and returns
 * the transaction hash on success.
 */
export async function sendBNB(
  toAddress: string,
  amountHuman: number
): Promise<TransferResult> {
  try {
    if (amountHuman <= 0) {
      return { success: false, error: "Transfer amount must be greater than zero" };
    }
    if (!isAddress(toAddress)) {
      return { success: false, error: "Invalid BNB Chain address" };
    }

    const account = getTreasuryAccount();
    const wallet = createWalletClient({ account, chain: CHAIN, transport: http(RPC_URL) });

    const hash = await wallet.sendTransaction({
      to: getAddress(toAddress),
      value: parseEther(amountHuman.toFixed(BNB_DECIMALS)),
    });

    const receipt = await getPublicClient().waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") {
      return { success: false, hash, error: "Transaction reverted" };
    }

    return { success: true, hash };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Stable public name used by the reward engine / API routes.
 * Rewarding a user is a native BNB transfer from the treasury to their address.
 */
export const transferReward = sendBNB;

/** Read an address's native BNB balance. Returns null on RPC failure. */
export async function getBNBBalance(address: string): Promise<TokenBalance | null> {
  try {
    if (!isAddress(address)) return null;
    const wei = await getPublicClient().getBalance({ address: getAddress(address) });
    return {
      contract: "native",
      owner: address,
      amount: wei,
      decimals: BNB_DECIMALS,
      uiAmount: Number(formatEther(wei)),
    };
  } catch {
    return null;
  }
}

/** Treasury BNB balance — for monitoring payout capacity. */
export async function getTreasuryBalance(): Promise<number> {
  const balance = await getBNBBalance(getTreasuryAccount().address);
  return balance?.uiAmount ?? 0;
}
