/**
 * Native XLM payments — SERVER ONLY.
 *
 * Rewarding a user = a classic Stellar Payment operation sending native XLM
 * from the treasury account to their wallet. No Soroban contract involved —
 * the treasury must hold enough real XLM to cover payouts.
 */
import {
  Asset,
  Horizon,
  TransactionBuilder,
  BASE_FEE,
  Operation,
} from "@stellar/stellar-sdk";
import { getTreasuryKeypair } from "./treasury";
import { HORIZON_URL, NETWORK_PASSPHRASE, XLM_DECIMALS, toBaseUnits } from "./config";
import type { TransferResult, StellarTokenBalance } from "@/types/stellar";

let _horizon: Horizon.Server | null = null;
function getHorizon(): Horizon.Server {
  if (!_horizon) {
    _horizon = new Horizon.Server(HORIZON_URL, {
      allowHttp: HORIZON_URL.startsWith("http://"),
    });
  }
  return _horizon;
}

async function accountExists(server: Horizon.Server, address: string): Promise<boolean> {
  try {
    await server.loadAccount(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Send `amountHuman` XLM to a Stellar address via a classic Payment operation.
 * Returns the transaction hash on success.
 *
 * The destination must already be a funded Stellar account — reward amounts
 * are typically far below the ~1 XLM base reserve required to create a new
 * account, so we don't attempt `createAccount` for unfunded addresses.
 */
export async function sendXLM(
  toAddress: string,
  amountHuman: number
): Promise<TransferResult> {
  try {
    if (amountHuman <= 0) {
      return { success: false, error: "Transfer amount must be greater than zero" };
    }

    const server = getHorizon();
    const treasury = getTreasuryKeypair();

    if (!(await accountExists(server, toAddress))) {
      return {
        success: false,
        error:
          "Destination wallet has no Stellar account yet — fund it with XLM first (e.g. via Friendbot on testnet) before claiming.",
      };
    }

    const source = await server.loadAccount(treasury.publicKey());

    const tx = new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.payment({
          destination: toAddress,
          asset: Asset.native(),
          amount: amountHuman.toFixed(XLM_DECIMALS),
        })
      )
      .setTimeout(60)
      .build();

    tx.sign(treasury);
    const sent = await server.submitTransaction(tx);

    return { success: true, hash: sent.hash };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Stable public name used by the reward engine / API routes.
 * Rewarding a user is a native XLM payment from the treasury to their address.
 */
export const transferReward = sendXLM;

/**
 * Read an address's native XLM balance via Horizon.
 * Returns null if the account doesn't exist on-chain yet.
 */
export async function getXLMBalance(address: string): Promise<StellarTokenBalance | null> {
  try {
    const server = getHorizon();
    const account = await server.loadAccount(address);
    const native = account.balances.find((b) => b.asset_type === "native");
    if (!native) return null;

    const uiAmount = parseFloat(native.balance);

    return {
      contract: "native",
      owner: address,
      amount: toBaseUnits(uiAmount),
      decimals: XLM_DECIMALS,
      uiAmount,
    };
  } catch {
    return null;
  }
}

/** Treasury XLM balance — for monitoring payout capacity. */
export async function getTreasuryBalance(): Promise<number> {
  const treasury = getTreasuryKeypair();
  const balance = await getXLMBalance(treasury.publicKey());
  return balance?.uiAmount ?? 0;
}
