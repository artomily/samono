"use client";

import { useState } from "react";
import { useStellarWallet } from "@/components/StellarWalletProvider";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

const MONO = "var(--font-geist-mono), 'Courier New', monospace";
const CYAN = "#00E5FF";

export function LoginOverlay() {
  const { address, connected, connect, signMessage } = useStellarWallet();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      if (!address) {
        setError("Please connect your wallet first.");
        return;
      }

      const timestamp = Date.now();
      const message = `Samono Login\n\nWallet: ${address}\nTimestamp: ${timestamp}`;
      const signature = await signMessage(message);

      const body = { publicKey: address, signature, timestamp };

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
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(59,130,246,0.05), transparent)",
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
            "radial-gradient(circle, rgba(59,130,246,0.08) 1px, transparent 1px)",
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
            color: "rgba(59,130,246,0.7)",
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
            textShadow: "0 0 32px rgba(59,130,246,0.4)",
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
          Connect your Stellar wallet to start earning SMT
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "22rem",
          border: "1px solid rgba(59,130,246,0.2)",
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
              border: "1px solid rgba(239,68,68,0.3)",
              background: "rgba(239,68,68,0.07)",
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
          <button
            type="button"
            onClick={() => connect()}
            style={{
              width: "100%",
              border: "1px solid rgba(59,130,246,0.35)",
              background: "rgba(59,130,246,0.08)",
              padding: "0.75rem",
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
              color: "#e0f7ff",
              fontFamily: MONO,
              cursor: "pointer",
            }}
          >
            {connected && address ? "WALLET CONNECTED" : "CONNECT WALLET"}
          </button>
          {connected && address && (
            <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", fontFamily: MONO }}>
              {address.slice(0, 8)}…{address.slice(-8)}
            </p>
          )}
        </div>

        {/* Sign in button */}
        <button
          disabled={!connected || loading || success}
          onClick={() => handleSignIn()}
          style={{
            width: "100%",
            border: `1px solid rgba(59,130,246,0.3)`,
            background: "rgba(59,130,246,0.06)",
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
        © {new Date().getFullYear()} SAMONO. BUILT ON STELLAR.
      </p>
    </div>
  );
}
