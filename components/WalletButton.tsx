"use client";

import { useTransition } from "react";
import { useStellarWallet } from "@/components/StellarWalletProvider";
import { Button } from "@/components/ui/button";
import { Wallet, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface WalletButtonProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

export function WalletButton({ className, size = "default" }: WalletButtonProps) {
  const { address, connected, connecting, connect, disconnect } = useStellarWallet();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (connected && address) {
      startTransition(async () => {
        await disconnect();
        toast.info("Wallet disconnected");
      });
    } else {
      connect().catch(() => toast.error("Could not connect wallet"));
    }
  };

  const truncated = address ? `${address.slice(0, 4)}…${address.slice(-4)}` : null;
  const busy = isPending || connecting;

  return (
    <Button
      variant={connected ? "outline" : "default"}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={busy}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Wallet className="h-4 w-4" />
      )}
      {connected && truncated ? truncated : "Connect Wallet"}
    </Button>
  );
}
