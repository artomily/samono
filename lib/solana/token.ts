import {
  PublicKey,
  type Connection,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  type TransactionSignature,
} from "@solana/web3.js";
import { AnchorProvider, Program, setProvider, BN } from "@coral-xyz/anchor";
import { getConnection } from "./connection";
import { getTreasuryKeypair } from "./treasury";
import type { TransferResult, SolanaTokenBalance } from "@/types/solana";
import { SAMONO_SWAP_IDL } from "./idl";

// ─── PDA derivations ──────────────────────────────────────────────────────────

const TREASURY_SEED = Buffer.from("treasury");
const CONFIG_SEED = Buffer.from("config");

function getSwapProgramId(): PublicKey {
  const id = process.env.SWAP_PROGRAM_ID;
  if (!id) throw new Error("SWAP_PROGRAM_ID env var is not set. Deploy the Anchor program first.");
  return new PublicKey(id);
}

function deriveConfigPda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([CONFIG_SEED], programId);
}

function deriveTreasuryPda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([TREASURY_SEED], programId);
}

// ─── Anchor transfer (active when SWAP_PROGRAM_ID is set) ────────────────────

async function transferSOLAnchor(
  toWalletAddress: string,
  lamports: number
): Promise<TransferResult> {
  const connection: Connection = getConnection();
  const authority = getTreasuryKeypair(); // authority == admin stored in Config PDA
  const programId = getSwapProgramId();

  // Build an AnchorProvider backed by the server-side authority keypair
  // Minimal wallet interface for Anchor
  const anchorWallet = {
    publicKey: authority.publicKey,
    signTransaction: async (tx: Transaction) => {
      tx.sign(authority);
      return tx;
    },
    signAllTransactions: async (txs: Transaction[]) => {
      return txs.map((tx) => {
        tx.sign(authority);
        return tx;
      });
    },
  };

  const provider = new AnchorProvider(connection, anchorWallet as any, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  setProvider(provider);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program = new Program(SAMONO_SWAP_IDL as any, programId, provider);

  const [configPda] = deriveConfigPda(programId);
  const [treasuryPda] = deriveTreasuryPda(programId);
  const userPubkey = new PublicKey(toWalletAddress);

  const tx = await program.methods
    .swapPoints(new BN(lamports))
    .accounts({
      authority: authority.publicKey,
      config: configPda,
      treasury: treasuryPda,
      user: userPubkey,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: "confirmed" });

  return { success: true, signature: tx };
}

// ─── Legacy direct transfer (fallback when program not yet deployed) ──────────

async function transferSOLDirect(
  toWalletAddress: string,
  lamports: number
): Promise<TransferResult> {
  const connection: Connection = getConnection();
  const treasury = getTreasuryKeypair();
  const recipientPubkey = new PublicKey(toWalletAddress);

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
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Transfer native SOL from the treasury to a recipient wallet.
 * Amount is in human-readable units (e.g. 0.1 = 0.1 SOL).
 *
 * When SWAP_PROGRAM_ID env var is set, the Anchor program is used.
 * Otherwise falls back to a direct SystemProgram.transfer (devnet only).
 */
export async function transferSOL(
  toWalletAddress: string,
  amountHuman: number
): Promise<TransferResult> {
  try {
    const lamports = Math.round(amountHuman * LAMPORTS_PER_SOL);
    if (lamports <= 0) {
      return { success: false, error: "Transfer amount must be greater than zero" };
    }

    if (process.env.SWAP_PROGRAM_ID) {
      return await transferSOLAnchor(toWalletAddress, lamports);
    }
    return await transferSOLDirect(toWalletAddress, lamports);
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
