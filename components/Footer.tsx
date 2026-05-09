"use client";

import Link from "next/link";

const MONO = "var(--font-geist-mono), 'Courier New', monospace";
const CYAN = "#00E5FF";

const APP_LINKS = [
  ["DASHBOARD", "/dashboard"],
  ["WATCH", "/watch"],
  ["LEADERBOARD", "/leaderboard"],
  ["REFERRAL", "/referral"],
] as const;

const PROTOCOL_LINKS = [
  ["WALLET", "/wallet"],
  ["SWAP POINTS", "/dashboard/swap"],
  ["PROFILE", "/profile"],
] as const;

export function Footer() {
  return (
    <footer
      style={{
        background: "#000",
        borderTop: "1px solid rgba(0,229,255,0.10)",
        padding: "3.5rem 2rem 2rem",
        fontFamily: MONO,
      }}
    >
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        {/* Top row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "2.5rem",
            marginBottom: "2.5rem",
          }}
        >
          {/* Brand */}
          <div style={{ maxWidth: "22rem" }}>
            <div
              style={{
                color: CYAN,
                fontWeight: 700,
                letterSpacing: "0.14em",
                fontSize: "0.88rem",
                marginBottom: "0.6rem",
                textShadow: "0 0 18px rgba(0,229,255,0.3)",
              }}
            >
              SAMONO
            </div>
            <p
              style={{
                color: "rgba(255,255,255,0.28)",
                fontSize: "0.68rem",
                letterSpacing: "0.06em",
                lineHeight: 1.65,
              }}
            >
              WATCH-TO-EARN PROTOCOL ON SOLANA. TURN KNOWLEDGE INTO REAL SOL
              REWARDS. FRAUD-PROOF, ON-CHAIN, VERIFIABLE.
            </p>
          </div>

          {/* Link columns */}
          <div style={{ display: "flex", gap: "3.5rem", flexWrap: "wrap" }}>
            <div>
              <div
                style={{
                  color: "rgba(255,255,255,0.18)",
                  fontSize: "0.58rem",
                  letterSpacing: "0.22em",
                  marginBottom: "1rem",
                }}
              >
                APP
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {APP_LINKS.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    style={{
                      color: "rgba(255,255,255,0.32)",
                      fontSize: "0.66rem",
                      letterSpacing: "0.12em",
                      textDecoration: "none",
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = CYAN)}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "rgba(255,255,255,0.32)")
                    }
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div
                style={{
                  color: "rgba(255,255,255,0.18)",
                  fontSize: "0.58rem",
                  letterSpacing: "0.22em",
                  marginBottom: "1rem",
                }}
              >
                PROTOCOL
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {PROTOCOL_LINKS.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    style={{
                      color: "rgba(255,255,255,0.32)",
                      fontSize: "0.66rem",
                      letterSpacing: "0.12em",
                      textDecoration: "none",
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = CYAN)}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "rgba(255,255,255,0.32)")
                    }
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            margin: "0 0 1.5rem",
          }}
        />

        {/* Bottom row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.18)",
              fontSize: "0.6rem",
              letterSpacing: "0.1em",
            }}
          >
            © {new Date().getFullYear()} SAMONO. ALL RIGHTS RESERVED.
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#9945FF",
                boxShadow: "0 0 10px #9945FF",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                color: "rgba(255,255,255,0.28)",
                fontSize: "0.6rem",
                letterSpacing: "0.14em",
              }}
            >
              BUILT ON SOLANA
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
