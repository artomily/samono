"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Coins, Loader2, FlaskConical, CheckCircle2, AlertCircle } from "lucide-react";
import { Suspense } from "react";

const IS_DEV = process.env.NODE_ENV !== "production";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { publicKey, connected, signMessage } = useWallet();

  const [referralCode, setReferralCode] = useState(
    searchParams.get("ref") ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignIn = async (opts?: { devMode?: boolean }) => {
    setError(null);
    setLoading(true);

    try {
      let body: Record<string, unknown>;

      if (opts?.devMode) {
        body = { devMode: true, referralCode: referralCode || undefined };
      } else {
        if (!publicKey || !signMessage) {
          setError("Please connect your wallet first.");
          return;
        }

        const timestamp = Date.now();
        const message = new TextEncoder().encode(
          `SMT Watch Login\n\nWallet: ${publicKey.toBase58()}\nTimestamp: ${timestamp}`
        );
        const signatureBytes = await signMessage(message);
        const bs58 = await import("bs58");
        const signature = bs58.default.encode(signatureBytes);

        body = {
          publicKey: publicKey.toBase58(),
          signature,
          timestamp,
          referralCode: referralCode || undefined,
        };
      }

      const res = await fetch("/api/auth/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Sign-in failed. Please try again.");
        return;
      }

      // In dummy mode the cookie is already set by the API response
      if (!data.dummy) {
        const supabase = createClient();
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      }

      setSuccess(true);
      const next = searchParams.get("next") ?? "/dashboard";
      router.push(next);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg.includes("rejected") ? "Signature request was rejected." : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm border-border/50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Coins className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to SMT Watch</CardTitle>
          <CardDescription>
            Connect your Solana wallet to start earning tokens
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 rounded-md px-3 py-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Signed in! Redirecting…</span>
            </div>
          )}

          {/* Wallet connect */}
          <div className="flex flex-col items-center gap-3">
            <WalletMultiButton style={{ width: "100%" }} />
            {connected && publicKey && (
              <p className="text-xs text-muted-foreground font-mono">
                {publicKey.toBase58().slice(0, 8)}…
                {publicKey.toBase58().slice(-8)}
              </p>
            )}
          </div>

          {/* Referral code */}
          <div className="space-y-1.5">
            <Label htmlFor="referral">
              Referral Code{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="referral"
              placeholder="Enter a friend's username"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Both you and your referrer earn bonus tokens.
            </p>
          </div>

          {/* Sign in button */}
          <Button
            className="w-full font-semibold"
            disabled={!connected || loading || success}
            onClick={() => handleSignIn()}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Signing in…" : "Sign In with Wallet"}
          </Button>

          {/* Dev mode — only rendered outside production */}
          {IS_DEV && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Dev only
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2 border-dashed border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300"
                disabled={loading || success}
                onClick={() => handleSignIn({ devMode: true })}
              >
                <FlaskConical className="h-4 w-4" />
                Dev Mode (skip wallet)
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Dev Mode uses a test account. Not available in production.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
