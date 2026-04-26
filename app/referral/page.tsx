"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Copy,
  CheckCheck,
  Share2,
  Coins,
  ExternalLink,
  Gift,
} from "lucide-react";
import { toast } from "sonner";
import { truncateAddress } from "@/lib/utils";

interface ReferralStats {
  referralCode: string | null;
  totalReferrals: number;
  referralEarnings: number;
  referredUsers: Array<{
    id: string;
    username: string | null;
    wallet_address: string | null;
    created_at: string;
  }>;
}

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReferralPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/referral");
      if (res.status === 401) {
        router.push("/login?next=/referral");
        return;
      }
      if (res.ok) {
        setStats(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://smtwatch.io";
  const referralLink = stats?.referralCode
    ? `${origin}/login?ref=${stats.referralCode}`
    : null;

  const copyLink = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      await navigator.share({
        title: "Join Samono — Earn tokens by watching videos",
        text: "Sign up with my referral and we both earn bonus SMT tokens!",
        url: referralLink,
      });
    } else {
      copyLink();
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Referral Program
        </h1>
        <p className="mt-1 text-muted-foreground">
          Invite friends to Samono and earn bonus tokens together.
        </p>
      </div>

      {/* How it works */}
      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="h-4 w-4 text-primary" />
            How it works
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3 text-sm">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-primary">1. Share</span>
            <span className="text-muted-foreground">
              Copy your referral link and share it with friends.
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-primary">2. They join</span>
            <span className="text-muted-foreground">
              They connect their wallet using your link.
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-primary">3. You earn</span>
            <span className="text-muted-foreground">
              You receive a 10% bonus on every reward they earn.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Your referral link */}
      <Card className="mb-8 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Your Referral Link</CardTitle>
          <CardDescription>
            Share this link — your referral code is your username.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <Skeleton className="h-10 w-full" />
          ) : referralLink ? (
            <>
              <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 font-mono text-sm break-all">
                <span className="flex-1 text-muted-foreground">{referralLink}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={copyLink}
                >
                  {copied ? (
                    <CheckCheck className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={shareLink}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Set a username in your profile to get a referral code.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {loading ? (
          <>
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </>
        ) : (
          <>
            <StatCard
              label="Total Referrals"
              value={stats?.totalReferrals ?? 0}
              icon={Users}
            />
            <StatCard
              label="Referral Earnings"
              value={`${stats?.referralEarnings ?? 0} SMT`}
              icon={Coins}
              sub="10% of referred users' rewards"
            />
          </>
        )}
      </div>

      {/* Referred users list */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Referred Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !stats?.referredUsers.length ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              <Users className="h-10 w-10 opacity-30" />
              <p className="text-sm">No referrals yet. Share your link!</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {stats.referredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {user.username ?? (
                        <span className="font-mono text-muted-foreground text-xs">
                          {user.wallet_address
                            ? truncateAddress(user.wallet_address)
                            : "Anonymous"}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-xs border-green-500/30 text-green-400"
                    >
                      Active
                    </Badge>
                    {user.wallet_address && (
                      <a
                        href={`https://explorer.solana.com/address/${user.wallet_address}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
