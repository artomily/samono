#!/usr/bin/env node
/**
 * Stellar Treasury Setup
 *
 * Generates (or reuses) the treasury keypair that funds every reward payout,
 * funds it on testnet via Friendbot, and prints the env vars to add to your
 * .env.local. Rewards are paid as native XLM — the treasury just needs a real
 * XLM balance, no contract deploy required.
 *
 * Usage:
 *   npm run setup:stellar
 */

import { Keypair } from "@stellar/stellar-sdk";
import * as fs from "fs";
import * as path from "path";

const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet";
const FRIENDBOT_URL =
  process.env.FRIENDBOT_URL ?? "https://friendbot.stellar.org";
const KEYPAIR_PATH = path.join(process.cwd(), ".treasury-keypair.json");

async function main() {
  console.log("🚀 Stellar Treasury Setup");
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
  console.log(`💼 Treasury address: ${treasury.publicKey()}`);

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
  } else {
    console.log("\n⚠️  Public network — fund the treasury with real XLM before going live.");
  }

  // ── Output ────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("✅ Treasury Ready!");
  console.log("═".repeat(60));
  console.log("\n📋 Add these to your .env.local:\n");
  console.log(`TREASURY_SECRET_KEY=${treasury.secret()}`);
  console.log(`NEXT_PUBLIC_STELLAR_NETWORK=${NETWORK}`);
  console.log(`HORIZON_URL=https://horizon-testnet.stellar.org`);
  console.log(`NETWORK_PASSPHRASE=Test SDF Network ; September 2015`);
  console.log("\n⚠️  IMPORTANT:");
  console.log("   - Keep .treasury-keypair.json and TREASURY_SECRET_KEY SECRET.");
  console.log("   - .treasury-keypair.json is gitignored.");
  console.log("   - Reward payouts are limited by the treasury's real XLM balance.");
  console.log(`   - View treasury on Stellar Expert:`);
  console.log(`     https://stellar.expert/explorer/${NETWORK}/account/${treasury.publicKey()}`);
  console.log("═".repeat(60) + "\n");
}

main().catch((err) => {
  console.error("❌ Setup failed:", err);
  process.exit(1);
});
