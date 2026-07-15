#!/usr/bin/env node
/**
 * Stellar Treasury / Admin Setup
 *
 * Generates (or reuses) the treasury keypair that acts as the SMT token
 * contract's `admin`, funds it on testnet via Friendbot, and prints the env
 * vars to add to your .env.local.
 *
 * Usage:
 *   npm run setup:stellar
 *
 * After this, deploy the contract with the Stellar CLI and set SMT_CONTRACT_ID:
 *   stellar contract build
 *   stellar contract deploy \
 *     --wasm target/wasm32v1-none/release/samono_token.wasm \
 *     --source <this-account> --network testnet \
 *     -- --admin <ADMIN_G_ADDRESS> --decimal 7 --name "Samono Token" --symbol SMT
 */

import { Keypair } from "@stellar/stellar-sdk";
import * as fs from "fs";
import * as path from "path";

const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet";
const FRIENDBOT_URL =
  process.env.FRIENDBOT_URL ?? "https://friendbot.stellar.org";
const KEYPAIR_PATH = path.join(process.cwd(), ".treasury-keypair.json");

async function main() {
  console.log("🚀 Stellar Treasury / Admin Setup");
  console.log(`🌐 Network: ${NETWORK}\n`);

  // ── Load or generate the treasury keypair ────────────────────
  let treasury: Keypair;
  if (fs.existsSync(KEYPAIR_PATH)) {
    console.log("📂 Loading existing treasury keypair from .treasury-keypair.json");
    const secret = JSON.parse(fs.readFileSync(KEYPAIR_PATH, "utf-8")).secret as string;
    treasury = Keypair.fromSecret(secret);
  } else {
    console.log("🔑 Generating new treasury keypair...");
    treasury = Keypair.random();
    fs.writeFileSync(
      KEYPAIR_PATH,
      JSON.stringify({ publicKey: treasury.publicKey(), secret: treasury.secret() }, null, 2),
      "utf-8"
    );
    console.log("✅ Treasury keypair saved to .treasury-keypair.json");
  }
  console.log(`💼 Treasury / admin address: ${treasury.publicKey()}`);

  // ── Fund via Friendbot (testnet / futurenet only) ────────────
  if (NETWORK !== "public") {
    console.log("\n💸 Requesting Friendbot funding...");
    try {
      const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(treasury.publicKey())}`);
      if (res.ok) {
        console.log("✅ Account funded on", NETWORK);
      } else if (res.status === 400) {
        console.log("ℹ️  Account already funded (Friendbot returned 400).");
      } else {
        console.warn(`⚠️  Friendbot returned ${res.status}. Fund manually if needed.`);
      }
    } catch (err) {
      console.error("⚠️  Friendbot request failed:", err);
    }
  }

  // ── Output ────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("✅ Treasury Ready!");
  console.log("═".repeat(60));
  console.log("\n📋 Add these to your .env.local:\n");
  console.log(`TREASURY_SECRET_KEY=${treasury.secret()}`);
  console.log(`NEXT_PUBLIC_STELLAR_NETWORK=${NETWORK}`);
  console.log(`SOROBAN_RPC_URL=https://soroban-testnet.stellar.org`);
  console.log(`NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org`);
  console.log(`HORIZON_URL=https://horizon-testnet.stellar.org`);
  console.log(`NETWORK_PASSPHRASE=Test SDF Network ; September 2015`);
  console.log(`# Set after deploying the contract:`);
  console.log(`# SMT_CONTRACT_ID=C...`);
  console.log(`# NEXT_PUBLIC_SMT_CONTRACT_ID=C...`);
  console.log("\n⚠️  IMPORTANT:");
  console.log("   - Keep .treasury-keypair.json and TREASURY_SECRET_KEY SECRET.");
  console.log("   - .treasury-keypair.json is gitignored.");
  console.log(`   - View treasury on Stellar Expert:`);
  console.log(`     https://stellar.expert/explorer/${NETWORK}/account/${treasury.publicKey()}`);
  console.log("═".repeat(60) + "\n");
}

main().catch((err) => {
  console.error("❌ Setup failed:", err);
  process.exit(1);
});
