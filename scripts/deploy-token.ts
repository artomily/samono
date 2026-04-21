#!/usr/bin/env node
/**
 * SMT Token Deployment Script
 * Creates a new SPL Token (SMT) on Solana Devnet and mints initial supply to treasury.
 *
 * Usage:
 *   npm run deploy:token
 *
 * Output: SMT_MINT_ADDRESS + treasury wallet — add to .env.local
 */

import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getMint,
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const DECIMALS = 6;
const INITIAL_SUPPLY = 1_000_000; // 1 million SMT
const TREASURY_KEYPAIR_PATH = path.join(process.cwd(), ".treasury-keypair.json");

async function main() {
  console.log("🚀 SMT Token Deployment Script");
  console.log(`📡 RPC: ${RPC_URL}\n`);

  const connection = new Connection(RPC_URL, "confirmed");

  // ── Load or generate treasury keypair ────────────────────────
  let treasury: Keypair;
  if (fs.existsSync(TREASURY_KEYPAIR_PATH)) {
    console.log("📂 Loading existing treasury keypair from .treasury-keypair.json");
    const raw = JSON.parse(fs.readFileSync(TREASURY_KEYPAIR_PATH, "utf-8"));
    treasury = Keypair.fromSecretKey(Uint8Array.from(raw));
  } else {
    console.log("🔑 Generating new treasury keypair...");
    treasury = Keypair.generate();
    fs.writeFileSync(
      TREASURY_KEYPAIR_PATH,
      JSON.stringify(Array.from(treasury.secretKey)),
      "utf-8"
    );
    console.log(`✅ Treasury keypair saved to .treasury-keypair.json`);
  }
  console.log(`💼 Treasury address: ${treasury.publicKey.toBase58()}`);

  // ── Airdrop SOL for fees (Devnet only) ───────────────────────
  const balance = await connection.getBalance(treasury.publicKey);
  if (balance < 0.5 * LAMPORTS_PER_SOL) {
    console.log("\n💸 Requesting SOL airdrop for fees (devnet only)...");
    try {
      const sig = await connection.requestAirdrop(
        treasury.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(sig, "confirmed");
      console.log("✅ Airdrop received: 2 SOL");
    } catch (err) {
      console.error("⚠️  Airdrop failed (may be rate limited). Fund manually:");
      console.error(`   solana airdrop 2 ${treasury.publicKey.toBase58()} --url devnet`);
      process.exit(1);
    }
  } else {
    console.log(`✅ Treasury SOL balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  }

  // ── Create SMT Mint ───────────────────────────────────────────
  console.log("\n🪙 Creating SMT mint...");
  const mint = await createMint(
    connection,
    treasury,           // payer
    treasury.publicKey, // mint authority
    treasury.publicKey, // freeze authority (set to null to fully decentralize)
    DECIMALS
  );
  console.log(`✅ SMT Mint created: ${mint.toBase58()}`);

  // ── Create Treasury ATA ───────────────────────────────────────
  console.log("\n🏦 Creating treasury Associated Token Account...");
  const treasuryATA = await getOrCreateAssociatedTokenAccount(
    connection,
    treasury,
    mint,
    treasury.publicKey
  );
  console.log(`✅ Treasury ATA: ${treasuryATA.address.toBase58()}`);

  // ── Mint Initial Supply ───────────────────────────────────────
  const mintAmount = BigInt(INITIAL_SUPPLY) * BigInt(10 ** DECIMALS);
  console.log(`\n⚗️  Minting ${INITIAL_SUPPLY.toLocaleString()} SMT to treasury...`);
  const mintTx = await mintTo(
    connection,
    treasury,
    mint,
    treasuryATA.address,
    treasury, // mint authority
    mintAmount
  );
  console.log(`✅ Mint tx: ${mintTx}`);

  // ── Verify ────────────────────────────────────────────────────
  const mintInfo = await getMint(connection, mint);
  const supplyDisplay = Number(mintInfo.supply) / 10 ** DECIMALS;
  console.log(`✅ Total supply: ${supplyDisplay.toLocaleString()} SMT`);

  // ── Output ────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("✅ SMT Token Deployed Successfully!");
  console.log("═".repeat(60));
  console.log("\n📋 Add these to your .env.local:\n");
  console.log(`SMT_MINT_ADDRESS=${mint.toBase58()}`);
  console.log(
    `TREASURY_WALLET_KEYPAIR=${JSON.stringify(Array.from(treasury.secretKey))}`
  );
  console.log("\n🔗 View on Solscan (devnet):");
  console.log(`   https://solscan.io/token/${mint.toBase58()}?cluster=devnet`);
  console.log("\n⚠️  IMPORTANT:");
  console.log("   - Keep .treasury-keypair.json SECRET — it controls your treasury");
  console.log("   - .treasury-keypair.json is gitignored");
  console.log("   - Copy TREASURY_WALLET_KEYPAIR to your .env.local NOW");
  console.log("═".repeat(60) + "\n");
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});
