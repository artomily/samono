import { Metadata } from "next";
import { requireAuth } from "@/lib/auth/session";
import { getClaimableAmount, getRewardHistory } from "@/lib/dal/rewards";
import { ClaimButton } from "@/components/ClaimButton";
import { ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Rewards",
};

const CYAN = "#00E5FF";
const MONO = "var(--font-geist-mono), 'Courier New', monospace";

const STATUS_COLOR: Record<string, string> = {
  pending:    "#FF00AA",
  processing: "#FEBC2E",
  completed:  "#00FF87",
  failed:     "#FF6B00",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function RewardsPage() {
  const user = await requireAuth();
  const [claimable, history] = await Promise.all([
    getClaimableAmount(user.id),
    getRewardHistory(user.id),
  ]);

  return (
    <div style={{ background: "#000", fontFamily: MONO, color: "#fff", minHeight: "100vh", padding: "2rem" }}>
      <div style={{ maxWidth: "60rem", margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: "0.58rem", letterSpacing: "0.22em", color: "rgba(0,229,255,0.45)", marginBottom: "0.5rem" }}>
            ─── REWARD CENTER ───
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 900, letterSpacing: "0.04em" }}>REWARDS</h1>
          <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", marginTop: "0.3rem", letterSpacing: "0.06em" }}>
            Pending SOL from completed watch sessions
          </p>
        </div>

        {/* ── Claimable Balance ── */}
        <div style={{
          border: "1px solid rgba(0,229,255,0.22)",
          padding: "1.8rem 2rem",
          marginBottom: "2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}>
          <div>
            <div style={{ fontSize: "0.58rem", letterSpacing: "0.2em", color: "rgba(0,229,255,0.45)", marginBottom: "0.5rem" }}>
              CLAIMABLE BALANCE
            </div>
            <div style={{ fontSize: "2.2rem", fontWeight: 900, color: CYAN, letterSpacing: "-0.02em" }}>
              {claimable.toFixed(4)} <span style={{ fontSize: "1rem", opacity: 0.7 }}>SOL</span>
            </div>
          </div>

          {claimable > 0 ? (
            <div style={{ clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)" }}>
              <ClaimButton pendingAmount={claimable} />
            </div>
          ) : (
            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>
              WATCH VIDEOS TO EARN SOL →
            </div>
          )}
        </div>

        {/* ── History ── */}
        <div>
          <div style={{ fontSize: "0.58rem", letterSpacing: "0.22em", color: "rgba(0,229,255,0.45)", marginBottom: "1.2rem" }}>
            ─── HISTORY ───
          </div>

          {history.length === 0 ? (
            <div style={{
              border: "1px solid rgba(0,229,255,0.1)",
              padding: "3rem",
              textAlign: "center",
              color: "rgba(255,255,255,0.25)",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
            }}>
              NO REWARD HISTORY YET
            </div>
          ) : (
            <div style={{ border: "1px solid rgba(0,229,255,0.1)", overflow: "hidden" }}>
              {/* Table header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 0.5fr 0.6fr 2.5rem",
                padding: "0.6rem 1.2rem",
                borderBottom: "1px solid rgba(0,229,255,0.08)",
                fontSize: "0.56rem",
                letterSpacing: "0.18em",
                color: "rgba(0,229,255,0.45)",
              }}>
                <span>DATE</span>
                <span>AMOUNT</span>
                <span>STATUS</span>
                <span>TX</span>
              </div>

              {history.map((r, i) => (
                <div
                  key={r.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 0.5fr 0.6fr 2.5rem",
                    padding: "0.85rem 1.2rem",
                    alignItems: "center",
                    borderBottom: i < history.length - 1 ? "1px solid rgba(0,229,255,0.05)" : undefined,
                    fontSize: "0.64rem",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.04em" }}>
                    {formatDate(r.created_at)}
                  </span>
                  <span style={{ color: CYAN, fontWeight: 700 }}>
                    {r.amount.toFixed(4)} SOL
                  </span>
                  <span style={{
                    color: STATUS_COLOR[r.status] ?? "#fff",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontSize: "0.58rem",
                  }}>
                    {r.status}
                  </span>
                  <span>
                    {r.tx_signature ? (
                      <a
                        href={`https://solscan.io/tx/${r.tx_signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "rgba(0,229,255,0.5)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          textDecoration: "none",
                        }}
                      >
                        <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.58rem" }}>—</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
