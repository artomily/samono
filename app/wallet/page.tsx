"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, ExternalLink, RefreshCw, Wallet } from "lucide-react";
import { ClaimButton } from "@/components/ClaimButton";
import { toast } from "sonner";
import { truncateAddress, formatDuration } from "@/lib/utils";

interface BalanceData {
  pending_amount: number;
  on_chain_balance: number | null;
  history: Array<{
    id: string;
    amount: number;
    status: string;
    tx_signature: string | null;
    created_at: string;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-500/10 text-green-400 border-green-500/30",
  pending: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  processing: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  failed: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
};

export default function WalletPage() {
  const { publicKey, connected } = useWallet();
  const [data, setData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSavingWallet, startSavingWallet] = useTransition();

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rewards/balance");
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Save wallet address to profile when connected
  useEffect(() => {
    if (!publicKey) return;
    startSavingWallet(async () => {
      await fetch("/api/wallet/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: publicKey.toBase58(), walletType: "other" }),
      }).catch(() => {});
    });
  }, [publicKey]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const walletAddress = publicKey?.toBase58();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          My Wallet
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your SOL rewards and wallet connection
        </p>
      </div>

      {/* Wallet connection card */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Connected Wallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {connected && walletAddress ? (
            <>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <code className="text-sm font-mono text-muted-foreground">
                  {truncateAddress(walletAddress, 8)}
                </code>
                <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">
                  Connected
                </Badge>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Connect your Solana wallet to claim rewards
              </p>
              <WalletMultiButton />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Balance cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Pending Rewards</p>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold text-primary">
                {(data?.pending_amount ?? 0).toFixed(2)}{" "}
                <span className="text-sm font-normal text-muted-foreground">SOL</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">On-Chain Balance</p>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {data?.on_chain_balance != null
                  ? data.on_chain_balance.toFixed(2)
                  : "—"}{" "}
                <span className="text-sm font-normal text-muted-foreground">SOL</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Claim button */}
      <div className="flex items-center justify-between">
        <ClaimButton
          pendingAmount={data?.pending_amount ?? 0}
          disabled={!connected || loading}
          onClaimed={() => {
            setTimeout(fetchBalance, 2000);
          }}
        />
        <button
          onClick={fetchBalance}
          className="text-muted-foreground hover:text-foreground transition-colors p-2"
          disabled={loading}
          aria-label="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <Separator className="opacity-30" />

      {/* Transaction history */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : !data?.history?.length ? (
          <div className="rounded-lg border border-dashed border-border/50 py-12 text-center text-muted-foreground">
            <Coins className="mx-auto h-8 w-8 mb-3 opacity-40" />
            <p className="text-sm">No transactions yet. Watch videos to earn!</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <div className="divide-y divide-border/30">
              {data.history.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Coins className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">+{tx.amount.toFixed(2)} SOL</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${STATUS_COLORS[tx.status] ?? ""}`}
                    >
                      {tx.status}
                    </Badge>
                    {tx.tx_signature && (
                      <a
                        href={`https://solscan.io/tx/${tx.tx_signature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        aria-label="View on Solscan"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
