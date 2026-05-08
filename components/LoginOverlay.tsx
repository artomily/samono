"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

const IS_DEV = process.env.NODE_ENV !== "production";
const MONO = "var(--font-geist-mono), 'Courier New', monospace";
const CYAN = "#00E5FF";
const GREEN = "#FF00FF";

export function LoginOverlay() {
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

        body = { publicKey: publicKey.toBase58(), signature, timestamp };
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

      if (!data.dummy) {
        const supabase = createClient();
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      }

      setSuccess(true);

      if (data.isNewUser) {
        window.location.href = "/register";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(
        msg.toLowerCase().includes("rejected") || msg.toLowerCase().includes("user rejected")
          ? "You declined the signature request. Please try again."
          : "Something went wrong. Please refresh and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000",
        fontFamily: MONO,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
      }}
    >
      {/* Radial glow */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(255,102,0,0.05), transparent)",
        }}
      />

      {/* Dot grid */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(circle, rgba(255,102,0,0.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.5,
        }}
      />

      {/* Logo */}
      <div style={{ marginBottom: "2.5rem", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div
          style={{
            fontSize: "0.6rem",
            letterSpacing: "0.3em",
            color: "rgba(255,102,0,0.5)",
            marginBottom: "0.7rem",
          }}
        >
          WATCH TO EARN
        </div>
        <div
          style={{
            fontSize: "1.6rem",
            fontWeight: 900,
            letterSpacing: "0.12em",
            color: CYAN,
            textShadow: "0 0 32px rgba(255,102,0,0.4)",
          }}
        >
          ⊕ SAMONO
        </div>
        <p
          style={{
            marginTop: "0.7rem",
            fontSize: "0.75rem",
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.06em",
          }}
        >
          Connect your Solana wallet to start earning SOL
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "22rem",
          border: "1px solid rgba(255,102,0,0.2)",
          background: "rgba(255,255,255,0.02)",
          padding: "1.8rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.1rem",
        }}
      >
        {/* Top accent line */}
        <div
          aria-hidden
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: CYAN, opacity: 0.5 }}
        />

        {error && (
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "flex-start",
              border: "1px solid rgba(255,80,80,0.3)",
              background: "rgba(255,80,80,0.07)",
              padding: "0.6rem 0.8rem",
              fontSize: "0.72rem",
              color: "#fca5a5",
            }}
          >
            <AlertCircle style={{ width: "1rem", height: "1rem", flexShrink: 0, marginTop: "0.05rem" }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              border: "1px solid rgba(255,204,0,0.3)",
              background: "rgba(255,204,0,0.07)",
              padding: "0.6rem 0.8rem",
              fontSize: "0.72rem",
              color: "#6ee7b7",
            }}
          >
            <CheckCircle2 style={{ width: "1rem", height: "1rem", flexShrink: 0 }} />
            <span>Signed in! Redirecting…</span>
          </div>
        )}

        {/* Wallet connect */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <WalletMultiButton style={{ width: "100%" }} />
          {connected && publicKey && (
            <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", fontFamily: MONO }}>
              {publicKey.toBase58().slice(0, 8)}…{publicKey.toBase58().slice(-8)}
            </p>
          )}
        </div>

        {/* Sign in button */}
        <button
          disabled={!connected || loading || success}
          onClick={() => handleSignIn()}
          style={{
            width: "100%",
            border: `1px solid rgba(255,102,0,0.3)`,
            background: "rgba(255,102,0,0.06)",
            padding: "0.75rem",
            fontSize: "0.7rem",
            letterSpacing: "0.25em",
            color: "#e0f7ff",
            fontFamily: MONO,
            cursor: !connected || loading || success ? "not-allowed" : "pointer",
            opacity: !connected || loading || success ? 0.45 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            transition: "background 0.15s, border-color 0.15s",
          }}
        >
          {loading && <Loader2 className="animate-spin" style={{ width: "1rem", height: "1rem" }} />}
          {loading ? "SIGNING IN…" : "SIGN IN WITH WALLET"}
        </button>

        {/* Dev mode bypass */}
        {IS_DEV && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
              <span
                style={{
                  fontSize: "0.6rem",
                  color: "rgba(255,255,255,0.2)",
                  letterSpacing: "0.15em",
                }}
              >
                DEV
              </span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
            </div>
            <button
              disabled={loading || success}
              onClick={() => handleSignIn({ devMode: true })}
              style={{
                width: "100%",
                border: "1px solid rgba(255,180,0,0.25)",
                background: "rgba(255,180,0,0.05)",
                padding: "0.6rem",
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
                color: "rgba(255,200,80,0.7)",
                fontFamily: MONO,
                cursor: loading || success ? "not-allowed" : "pointer",
                opacity: loading || success ? 0.4 : 1,
              }}
            >
              DEV BYPASS LOGIN
            </button>
          </>
        )}
      </div>

      {/* Footer note */}
      <p
        style={{
          marginTop: "2rem",
          fontSize: "0.65rem",
          color: "rgba(255,255,255,0.15)",
          letterSpacing: "0.1em",
          position: "relative",
          zIndex: 1,
        }}
      >
        © {new Date().getFullYear()} SAMONO. BUILT ON SOLANA.
      </p>
    </div>
  );
}
