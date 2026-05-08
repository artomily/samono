"use client";

import { useMemo, useEffect } from "react";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { Toaster } from "@/components/ui/sonner";

/** Saves wallet address to the user profile whenever a wallet connects. */
function WalletAutoSave() {
  const { publicKey } = useWallet();
  useEffect(() => {
    if (!publicKey) return;
    fetch("/api/wallet/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: publicKey.toBase58(), walletType: "other" }),
    }).catch(() => {});
  }, [publicKey]);
  return null;
}

// Import wallet adapter default styles
import "@solana/wallet-adapter-react-ui/styles.css";

const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

export function Providers({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletAutoSave />
          {children}
          <Toaster position="bottom-right" theme="dark" richColors />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
