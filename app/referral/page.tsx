"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Copy, CheckCheck, Share2, ExternalLink } from "lucide-react";
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

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-white/8 ${className ?? "h-10 w-full"}`}
    />
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
        router.push("/dashboard");
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
    typeof window !== "undefined" ? window.location.origin : "https://samono.io";
  const referralLink = stats?.referralCode
    ? `${origin}/dashboard?ref=${stats.referralCode}`
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
        text: "Sign up with my referral and we both earn bonus SOL rewards!",
        url: referralLink,
      });
    } else {
      copyLink();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 lg:px-8 pb-16 pt-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-10 border-b border-white/8 pb-6">
          <div className="text-[10px] uppercase tracking-[0.4em] text-cyan-300/60 mb-2">
            grow
          </div>
          <h1 className="font-mono text-3xl sm:text-4xl uppercase tracking-[0.12em] text-white">
            Referral Program
          </h1>
          <p className="mt-2 text-sm leading-6 text-white/55">
            Invite friends to Samono and earn bonus tokens together
          </p>
        </div>

        {/* How it works */}
        <div className="mb-8 border border-cyan-300/20 bg-cyan-300/4 p-5 md:p-6">
          <div className="text-[10px] uppercase tracking-[0.34em] text-cyan-300/60 mb-5">
            how it works
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { step: "01", label: "Share", desc: "Copy your referral link and share it with friends." },
              { step: "02", label: "They Join", desc: "They connect their wallet using your link." },
              { step: "03", label: "You Earn", desc: "You receive a 10% bonus on every reward they earn." },
            ].map((item) => (
              <div key={item.step} className="flex flex-col gap-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/50">
                  step {item.step}
                </div>
                <div className="font-mono text-sm uppercase tracking-[0.16em] text-white">
                  {item.label}
                </div>
                <div className="text-sm leading-6 text-white/50">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {loading ? (
            <>
              <SkeletonBar className="h-24 w-full" />
              <SkeletonBar className="h-24 w-full" />
            </>
          ) : (
            <>
              <div className="border border-white/10 bg-white/3 p-5">
                <div className="text-[10px] uppercase tracking-[0.3em] text-white/35 mb-3">
                  total referrals
                </div>
                <div className="font-mono text-3xl text-white">
                  {stats?.totalReferrals ?? 0}
                </div>
              </div>
              <div className="border border-white/10 bg-white/3 p-5">
                <div className="text-[10px] uppercase tracking-[0.3em] text-white/35 mb-3">
                  referral earnings
                </div>
                <div className="font-mono text-3xl text-emerald-300">
                  {(stats?.referralEarnings ?? 0).toFixed(2)}
                  <span className="text-white/30 text-base ml-1">SOL</span>
                </div>
                <div className="text-[11px] text-white/30 mt-1">10% of referred users&apos; rewards</div>
              </div>
            </>
          )}
        </div>

        {/* Referral link */}
        <div className="mb-8 border border-white/10 bg-white/3 p-5 md:p-6">
          <div className="text-[10px] uppercase tracking-[0.34em] text-white/40 mb-1">
            your referral link
          </div>
          <div className="text-sm text-white/45 mb-5">
            Share this link — your referral code is your username
          </div>

          {loading ? (
            <SkeletonBar className="h-10 w-full" />
          ) : referralLink ? (
            <div className="space-y-3">
              <div className="border border-white/10 bg-black/50 px-4 py-3">
                <code className="font-mono text-sm text-cyan-300/80 break-all leading-6">
                  {referralLink}
                </code>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={copyLink}
                  className="flex-1 flex items-center justify-center gap-2 border border-white/12 py-2.5 text-[11px] uppercase tracking-[0.26em] text-white/70 hover:border-cyan-300/40 hover:text-cyan-200 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  {copied ? (
                    <CheckCheck className="h-4 w-4 text-emerald-300" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Copy Link"}
                </button>
                <button
                  onClick={shareLink}
                  className="flex-1 flex items-center justify-center gap-2 border border-white/12 py-2.5 text-[11px] uppercase tracking-[0.26em] text-white/70 hover:border-cyan-300/40 hover:text-cyan-200 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-white/35">
              Set a username in your profile to get a referral code.
            </p>
          )}
        </div>

        {/* Referred users */}
        <div className="border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 bg-white/3">
            <div className="text-[10px] uppercase tracking-[0.34em] text-white/40">
              referred users
            </div>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(3)].map((_, i) => (
                <SkeletonBar key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !stats?.referredUsers.length ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/25">
                no referrals yet
              </div>
              <p className="text-sm text-white/20">Share your link to get started</p>
            </div>
          ) : (
            <div>
              {stats.referredUsers.map((user, idx) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between gap-3 px-5 py-3 border-b border-white/5 last:border-0 ${idx % 2 === 0 ? "" : "bg-white/1.5"}`}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-mono text-sm uppercase tracking-wider text-white/85 truncate">
                      {user.username ?? (
                        <span className="text-white/40">
                          {user.wallet_address
                            ? truncateAddress(user.wallet_address)
                            : "anonymous"}
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-white/30">
                      joined {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] uppercase tracking-[0.22em] text-emerald-300/70">
                      active
                    </span>
                    {user.wallet_address && (
                      <a
                        href={`https://explorer.solana.com/address/${user.wallet_address}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/25 hover:text-cyan-300/60 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
