/**
 * Minimal IDL stub for samono_swap.
 * This file is REPLACED by `target/idl/samono_swap.json` after running `anchor build`.
 * Keep in sync with programs/samono-swap/src/lib.rs.
 */
export const SAMONO_SWAP_IDL = {
  version: "0.1.0",
  name: "samono_swap",
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "payer", isMut: true, isSigner: true },
        { name: "config", isMut: true, isSigner: false },
        { name: "treasury", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "admin", type: "publicKey" }],
    },
    {
      name: "swapPoints",
      accounts: [
        { name: "authority", isMut: false, isSigner: true },
        { name: "config", isMut: false, isSigner: false },
        { name: "treasury", isMut: true, isSigner: false },
        { name: "user", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "solAmountLamports", type: "u64" }],
    },
    {
      name: "fundTreasury",
      accounts: [
        { name: "funder", isMut: true, isSigner: true },
        { name: "treasury", isMut: true, isSigner: false },
        { name: "config", isMut: false, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "amountLamports", type: "u64" }],
    },
  ],
  accounts: [
    {
      name: "Config",
      type: {
        kind: "struct",
        fields: [
          { name: "admin", type: "publicKey" },
          { name: "bump", type: "u8" },
          { name: "treasuryBump", type: "u8" },
        ],
      },
    },
  ],
  events: [
    {
      name: "SwapEvent",
      fields: [
        { name: "user", type: "publicKey", index: false },
        { name: "solAmountLamports", type: "u64", index: false },
        { name: "timestamp", type: "i64", index: false },
      ],
    },
  ],
  errors: [
    { code: 6000, name: "Unauthorized", msg: "Signer is not the registered admin authority." },
    { code: 6001, name: "ZeroAmount", msg: "Transfer amount must be greater than zero." },
    { code: 6002, name: "InsufficientTreasuryFunds", msg: "Treasury has insufficient funds to cover the transfer." },
  ],
} as const;

export type SamonoSwapIDL = typeof SAMONO_SWAP_IDL;
