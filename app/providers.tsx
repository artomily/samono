"use client";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import {
  StellarWalletProvider,
  useStellarWallet,
} from "@/components/StellarWalletProvider";

/** Saves the wallet address to the user profile whenever a wallet connects. */
function WalletAutoSave() {
  const { address, walletType } = useStellarWallet();
  useEffect(() => {
    if (!address) return;
    fetch("/api/wallet/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: address, walletType: walletType ?? "other" }),
    }).catch(() => {});
  }, [address, walletType]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StellarWalletProvider>
      <WalletAutoSave />
      {children}
      <Toaster position="bottom-right" theme="dark" richColors />
    </StellarWalletProvider>
  );
}
