/**
 * Generate a treasury account for BNB Smart Chain payouts.
 *
 *   npm run setup:bnb
 *
 * Prints a fresh private key + address. Put the key in .env as
 * TREASURY_PRIVATE_KEY, then fund the address with tBNB from
 * https://www.bnbchain.org/en/testnet-faucet (testnet).
 */
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const key = generatePrivateKey();
const account = privateKeyToAccount(key);

console.log("BNB Chain treasury generated\n");
console.log(`Address:              ${account.address}`);
console.log(`TREASURY_PRIVATE_KEY=${key}\n`);
console.log("Fund it (testnet): https://www.bnbchain.org/en/testnet-faucet");
