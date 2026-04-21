"use client";

import { useState, useTransition } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Wallet, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface WalletButtonProps {
  onConnected?: (address: string) => void;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

export function WalletButton({ onConnected, className, size = "default" }: WalletButtonProps) {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (connected && publicKey) {
      startTransition(async () => {
        await disconnect();
        toast.info("Wallet disconnected");
      });
    } else {
      setVisible(true);
    }
  };

  const truncated = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}`
    : null;

  return (
    <Button
      variant={connected ? "outline" : "default"}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Wallet className="h-4 w-4" />
      )}
      {connected && truncated ? truncated : "Connect Wallet"}
    </Button>
  );
}
