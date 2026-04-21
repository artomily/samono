import {
  PublicKey,
  type Connection,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  transfer,
  getAccount,
  getMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { getConnection } from "./connection";
import { getTreasuryKeypair } from "./treasury";
import type { TransferResult, SolanaTokenBalance } from "@/types/solana";

function getMintAddress(): PublicKey {
  const addr = process.env.SMT_MINT_ADDRESS;
  if (!addr) throw new Error("SMT_MINT_ADDRESS env var is not set");
  return new PublicKey(addr);
}

/**
 * Transfer SMT tokens from the treasury to a recipient wallet.
 * Amount is in human-readable units (e.g. 10 = 10 SMT, not 10_000_000).
 */
export async function transferSMT(
  toWalletAddress: string,
  amountHuman: number
): Promise<TransferResult> {
  try {
    const connection: Connection = getConnection();
    const treasury = getTreasuryKeypair();
    const mint = getMintAddress();

    const mintInfo = await getMint(connection, mint);
    const rawAmount = BigInt(Math.floor(amountHuman * 10 ** mintInfo.decimals));

    // Get or create treasury ATA
    const treasuryATA = await getOrCreateAssociatedTokenAccount(
      connection,
      treasury,
      mint,
      treasury.publicKey
    );

    // Get or create recipient ATA (treasury pays for creation)
    const recipientPubkey = new PublicKey(toWalletAddress);
    const recipientATA = await getOrCreateAssociatedTokenAccount(
      connection,
      treasury, // payer for ATA creation
      mint,
      recipientPubkey
    );

    const signature = await transfer(
      connection,
      treasury,
      treasuryATA.address,
      recipientATA.address,
      treasury,
      rawAmount
    );

    return { success: true, signature };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Get the SMT balance of a wallet address.
 * Returns human-readable balance (divided by decimals).
 */
export async function getSMTBalance(walletAddress: string): Promise<SolanaTokenBalance | null> {
  try {
    const connection = getConnection();
    const mint = getMintAddress();
    const mintInfo = await getMint(connection, mint);

    const ownerPubkey = new PublicKey(walletAddress);
    const { getAssociatedTokenAddressSync } = await import("@solana/spl-token");
    const ata = getAssociatedTokenAddressSync(mint, ownerPubkey);

    try {
      const account = await getAccount(connection, ata);
      const uiAmount = Number(account.amount) / 10 ** mintInfo.decimals;
      return {
        mint: mint.toBase58(),
        owner: walletAddress,
        amount: account.amount,
        decimals: mintInfo.decimals,
        uiAmount,
      };
    } catch {
      // Account doesn't exist yet — balance is 0
      return {
        mint: mint.toBase58(),
        owner: walletAddress,
        amount: BigInt(0),
        decimals: mintInfo.decimals,
        uiAmount: 0,
      };
    }
  } catch {
    return null;
  }
}

/**
 * Get treasury SMT balance (for monitoring).
 */
export async function getTreasuryBalance(): Promise<number> {
  const treasury = getTreasuryKeypair();
  const balance = await getSMTBalance(treasury.publicKey.toBase58());
  return balance?.uiAmount ?? 0;
}
