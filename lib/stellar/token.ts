/**
 * SMT token operations against the Soroban contract — SERVER ONLY.
 *
 * The backend is the contract admin. Rewarding a user = minting SMT to their
 * Stellar address. Because the admin keypair is the transaction source,
 * `admin.require_auth()` inside the contract is satisfied automatically.
 */
import {
  Address,
  Contract,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  rpc,
  xdr,
} from "@stellar/stellar-sdk";
import { getServer } from "./server";
import { getTreasuryKeypair } from "./treasury";
import {
  SMT_CONTRACT_ID,
  NETWORK_PASSPHRASE,
  SMT_DECIMALS,
  toBaseUnits,
  fromBaseUnits,
} from "./config";
import type { TransferResult, StellarTokenBalance } from "@/types/stellar";

function requireContractId(): string {
  if (!SMT_CONTRACT_ID) {
    throw new Error(
      "SMT_CONTRACT_ID env var is not set. Deploy the Soroban token contract first."
    );
  }
  return SMT_CONTRACT_ID;
}

async function pollTransaction(
  server: rpc.Server,
  hash: string,
  { attempts = 30, delayMs = 1000 } = {}
): Promise<rpc.Api.GetTransactionResponse> {
  for (let i = 0; i < attempts; i++) {
    const res = await server.getTransaction(hash);
    if (res.status !== rpc.Api.GetTransactionStatus.NOT_FOUND) {
      return res;
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(`Transaction ${hash} not confirmed after ${attempts} attempts`);
}

/**
 * Mint `amountHuman` SMT to a Stellar address by invoking the contract's
 * admin-only `mint`. Returns the transaction hash on success.
 */
export async function mintSMT(
  toAddress: string,
  amountHuman: number
): Promise<TransferResult> {
  try {
    const base = toBaseUnits(amountHuman);
    if (base <= BigInt(0)) {
      return { success: false, error: "Transfer amount must be greater than zero" };
    }

    const server = getServer();
    const admin = getTreasuryKeypair();
    const contract = new Contract(requireContractId());

    const source = await server.getAccount(admin.publicKey());

    const tx = new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          "mint",
          Address.fromString(toAddress).toScVal(),
          nativeToScVal(base, { type: "i128" })
        )
      )
      .setTimeout(60)
      .build();

    // Simulate + assemble footprint/auth/fees.
    const prepared = await server.prepareTransaction(tx);
    prepared.sign(admin);

    const sent = await server.sendTransaction(prepared);
    if (sent.status === "ERROR") {
      return {
        success: false,
        error: `Submission failed: ${JSON.stringify(sent.errorResult)}`,
      };
    }

    const final = await pollTransaction(server, sent.hash);
    if (final.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
      return { success: false, error: `Transaction failed on-chain (${final.status})` };
    }

    return { success: true, hash: sent.hash };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Stable public name used by the reward engine / API routes.
 * Rewarding a user is a mint of SMT to their address.
 */
export const transferReward = mintSMT;

/**
 * Read an address's SMT balance via a read-only simulation of `balance`.
 * Returns null on any error (e.g. address never received tokens).
 */
export async function getSMTBalance(
  address: string
): Promise<StellarTokenBalance | null> {
  try {
    const server = getServer();
    const contract = new Contract(requireContractId());
    const admin = getTreasuryKeypair();

    // A source account is required to build the (never-submitted) tx we simulate.
    const source = await server.getAccount(admin.publicKey());
    const tx = new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("balance", Address.fromString(address).toScVal()))
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);
    if (!rpc.Api.isSimulationSuccess(sim) || !sim.result?.retval) {
      return null;
    }

    const raw = scValToNative(sim.result.retval as xdr.ScVal) as bigint | number;
    const amount = BigInt(raw);

    return {
      contract: "SMT",
      owner: address,
      amount,
      decimals: SMT_DECIMALS,
      uiAmount: fromBaseUnits(amount),
    };
  } catch {
    return null;
  }
}

/** Treasury (admin) SMT balance — for monitoring. */
export async function getTreasuryBalance(): Promise<number> {
  const admin = getTreasuryKeypair();
  const balance = await getSMTBalance(admin.publicKey());
  return balance?.uiAmount ?? 0;
}
