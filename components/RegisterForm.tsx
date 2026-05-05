"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), referralCode: referralCode.trim() || undefined }),
      });

      const data = await res.json() as { success?: boolean; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        return;
      }

      setSuccess(true);
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
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
            account setup
          </div>
          <h1 className="font-mono text-3xl uppercase tracking-[0.12em] text-white">
            Samono
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Choose a username to activate your referral link and start earning
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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
                <span>Account created! Redirecting…</span>
              </div>
            )}

            {/* Username */}
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.3em] text-white/50">
                Username <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_handle"
                autoComplete="username"
                required
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_]+"
                className="w-full border border-white/15 bg-black px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-cyan-300/50 focus:ring-1 focus:ring-cyan-300/30 font-mono"
              />
              <p className="text-[11px] text-white/30">
                3–20 chars · letters, numbers, underscores
              </p>
            </div>

            {/* Referral code (optional) */}
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-[0.3em] text-white/50">
                Referral Code <span className="text-white/25">(optional)</span>
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="friend_username"
                autoComplete="off"
                maxLength={20}
                className="w-full border border-white/15 bg-black px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-cyan-300/50 focus:ring-1 focus:ring-cyan-300/30 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success || username.trim().length < 3}
              className="w-full border border-cyan-300/30 bg-cyan-300/8 py-3 text-[11px] uppercase tracking-[0.3em] text-cyan-100 transition-colors hover:border-cyan-300/60 hover:bg-cyan-300/12 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </div>
        </form>

        {/* 5000 XP starter hint */}
        <div className="mt-4 border border-emerald-400/15 bg-emerald-500/5 px-4 py-3">
          <div className="text-[10px] uppercase tracking-[0.3em] text-emerald-300/70 mb-1">
            welcome bonus
          </div>
          <p className="text-xs text-white/50">
            Your account starts with <span className="text-emerald-300 font-mono">5,000 pts</span> — enough to swap for SOL on testnet.
          </p>
        </div>
      </div>
    </div>
  );
}
