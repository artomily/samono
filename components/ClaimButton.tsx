"use client";

import { useState, useTransition } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Coins, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ClaimButtonProps {
  pendingAmount: number;
  onClaimed?: () => void;
  disabled?: boolean;
}

export function ClaimButton({ pendingAmount, onClaimed, disabled }: ClaimButtonProps) {
  const { publicKey } = useWallet();
  const [isPending, startTransition] = useTransition();

  const handleClaim = () => {
    if (!publicKey) {
      toast.error("Please connect your wallet to claim rewards.");
      return;
    }
    if (pendingAmount <= 0) {
      toast.info("No rewards to claim");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/rewards/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet_address: publicKey.toBase58() }),
        });
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Claim failed — please try again.");
          return;
        }

        toast.success(`Claimed ${pendingAmount.toFixed(2)} SOL! Tx: ${data.signature?.slice(0, 8)}…`);
        onClaimed?.();
      } catch {
        toast.error("Connection error — your points were not deducted. Please try again.");
      }
    });
  };

  const isDisabled = disabled || isPending || !publicKey || pendingAmount <= 0;

  return (
    <Button
      onClick={handleClaim}
      disabled={isDisabled}
      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Coins className="h-4 w-4" />
      )}
      {isPending ? "Claiming…" : `Claim ${pendingAmount.toFixed(2)} SOL`}
    </Button>
  );
}
