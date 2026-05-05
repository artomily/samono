"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, FlaskConical, CheckCircle2, AlertCircle } from "lucide-react";
import { Suspense } from "react";

const IS_DEV = process.env.NODE_ENV !== "production";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { publicKey, connected, signMessage } = useWallet();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignIn = async (opts?: { devMode?: boolean }) => {
    setError(null);
    setLoading(true);

    try {
      let body: Record<string, unknown>;

      if (opts?.devMode) {
        body = { devMode: true };
      } else {
        if (!publicKey || !signMessage) {
          setError("Please connect your wallet first.");
          return;
        }

        const timestamp = Date.now();
        const message = new TextEncoder().encode(
          `Samono Login\n\nWallet: ${publicKey.toBase58()}\nTimestamp: ${timestamp}`
        );
        const signatureBytes = await signMessage(message);
        const bs58 = await import("bs58");
        const signature = bs58.default.encode(signatureBytes);

        body = {
          publicKey: publicKey.toBase58(),
          signature,
          timestamp,
        };
      }

      const res = await fetch("/api/auth/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Sign-in failed. Please reconnect your wallet and try again.");
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
      // New users go to register page to set username; returning users go to dashboard (or next)
      if (data.isNewUser) {
        router.push("/register");
      } else {
        const next = searchParams.get("next") ?? "/dashboard";
        router.push(next);
      }
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(
        msg.toLowerCase().includes("rejected") || msg.toLowerCase().includes("user rejected")
          ? "You declined the signature request in your wallet. Please try again."
          : "Something went wrong. Please refresh the page and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="text-[10px] uppercase tracking-[0.4em] text-cyan-300/60 mb-3">
            watch to earn
          </div>
          <h1 className="font-mono text-3xl uppercase tracking-[0.12em] text-white">
            Samono
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Connect your Solana wallet to start earning SOL
          </p>
        </div>

        <div className="border border-white/10 bg-white/3 p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2 border border-red-400/30 bg-red-500/8 px-3 py-2.5 text-sm text-red-200">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 border border-emerald-400/30 bg-emerald-500/8 px-3 py-2.5 text-sm text-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Signed in! Redirecting…</span>
            </div>
          )}

          {/* Wallet connect */}
          <div className="flex flex-col items-center gap-3">
            <WalletMultiButton style={{ width: "100%" }} />
            {connected && publicKey && (
              <p className="text-[11px] text-white/35 font-mono">
                {publicKey.toBase58().slice(0, 8)}…{publicKey.toBase58().slice(-8)}
              </p>
            )}
          </div>

          {/* Sign in button */}
          <button
            className="w-full border border-cyan-300/30 bg-cyan-300/8 py-3 text-[11px] uppercase tracking-[0.3em] text-cyan-100 transition-colors hover:border-cyan-300/60 hover:bg-cyan-300/12 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black flex items-center justify-center gap-2"
            disabled={!connected || loading || success}
            onClick={() => handleSignIn()}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Signing in…" : "Sign In with Wallet"}
          </button>

          {/* Dev mode — only rendered outside production */}
          {IS_DEV && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-white/8" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/25">dev only</span>
                <div className="flex-1 border-t border-white/8" />
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

