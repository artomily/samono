"use client";

import dynamic from "next/dynamic";

// Dynamically import WalletMultiButton with no SSR to avoid hydration mismatch
const DynamicWalletButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false, loading: () => <div className="h-10 w-32 bg-muted rounded-md" /> }
);

export function ClientWalletButton() {
  return <DynamicWalletButton />;
}
