#!/usr/bin/env node
/**
 * SOL Treasury Setup Script
 * Prepares a treasury wallet for native SOL reward distribution on Solana Devnet.
 *
 * Usage:
 *   npm run deploy:token
 *
 * Output: treasury wallet keypair — add to .env.local
 */

import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const TREASURY_KEYPAIR_PATH = path.join(process.cwd(), ".treasury-keypair.json");

async function main() {
  console.log("🚀 SOL Treasury Setup Script");
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

  const finalBalance = await connection.getBalance(treasury.publicKey);
  console.log(`✅ Treasury ready with ${finalBalance / LAMPORTS_PER_SOL} SOL`);

  // ── Output ────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("✅ SOL Treasury Ready!");
  console.log("═".repeat(60));
  console.log("\n📋 Add these to your .env.local:\n");
  console.log(
    `TREASURY_WALLET_KEYPAIR=${JSON.stringify(Array.from(treasury.secretKey))}`
  );
  console.log(`NEXT_PUBLIC_SOLANA_NETWORK=${process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet"}`);
  console.log("\n🔗 View treasury on Solscan (devnet):");
  console.log(`   https://solscan.io/account/${treasury.publicKey.toBase58()}?cluster=devnet`);
  console.log("\n⚠️  IMPORTANT:");
  console.log("   - Keep .treasury-keypair.json SECRET — it controls your SOL treasury");
  console.log("   - .treasury-keypair.json is gitignored");
  console.log("   - Copy TREASURY_WALLET_KEYPAIR to your .env.local NOW");
  console.log("═".repeat(60) + "\n");
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});
