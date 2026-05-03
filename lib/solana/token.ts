import {
  PublicKey,
  type Connection,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { getConnection } from "./connection";
import { getTreasuryKeypair } from "./treasury";
import type { TransferResult, SolanaTokenBalance } from "@/types/solana";

/**
 * Transfer native SOL from the treasury to a recipient wallet.
 * Amount is in human-readable units (e.g. 0.1 = 0.1 SOL).
 *
 * TODO(smart-contract): When your on-chain swap program is deployed,
 * replace the SystemProgram.transfer below with a CPI call to your program:
 *   - Set NEXT_PUBLIC_SWAP_PROGRAM_ID in .env.local to the deployed Program ID
 *   - Call the swap instruction: { fromTreasury, toUser, pointsDeducted, solAmount }
 *   - The program validates points were deducted on-chain before releasing SOL
 */
export async function transferSOL(
  toWalletAddress: string,
  amountHuman: number
): Promise<TransferResult> {
  try {
    const connection: Connection = getConnection();
    const treasury = getTreasuryKeypair();
    const recipientPubkey = new PublicKey(toWalletAddress);
    const lamports = Math.round(amountHuman * LAMPORTS_PER_SOL);

    if (lamports <= 0) {
      return { success: false, error: "Transfer amount must be greater than zero" };
    }

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

    const transaction = new Transaction({
      feePayer: treasury.publicKey,
      blockhash,
      lastValidBlockHeight,
    }).add(
      SystemProgram.transfer({
        fromPubkey: treasury.publicKey,
        toPubkey: recipientPubkey,
        lamports,
      })
    );

    const signature = await connection.sendTransaction(transaction, [treasury], {
      preflightCommitment: "confirmed",
    });

    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");

    return { success: true, signature };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Get the native SOL balance of a wallet address.
 * Returns human-readable balance in SOL.
 */
export async function getSOLBalance(walletAddress: string): Promise<SolanaTokenBalance | null> {
  try {
    const connection = getConnection();
    const ownerPubkey = new PublicKey(walletAddress);
    const lamports = await connection.getBalance(ownerPubkey, "confirmed");

    return {
      mint: "SOL",
      owner: walletAddress,
      amount: BigInt(lamports),
      decimals: 9,
      uiAmount: lamports / LAMPORTS_PER_SOL,
    };
  } catch {
    return null;
  }
}

/**
 * Get treasury SOL balance (for monitoring).
 */
export async function getTreasuryBalance(): Promise<number> {
  const treasury = getTreasuryKeypair();
  const balance = await getSOLBalance(treasury.publicKey.toBase58());
  return balance?.uiAmount ?? 0;
}
