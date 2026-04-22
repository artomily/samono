import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTopEarners } from "@/lib/dal/leaderboard";
import { VideoCarousel } from "@/components/ClientWalletButton";
import { cn } from "@/lib/utils";
import {
  PlayCircle,
  Coins,
  Shield,
  Zap,
  TrendingUp,
  ArrowRight,
  Trophy,
  Users,
  Globe,
  CheckCircle,
  Star,
  ChevronDown,
} from "lucide-react";

// ─── Static data ────────────────────────────────────────────────────────────

const STATS = [
  { value: "12,400+", label: "Active Earners" },
  { value: "85,000", label: "SMT Distributed" },
  { value: "320+", label: "Videos Available" },
  { value: "1.2M", label: "Minutes Watched" },
];

const STEPS = [
  {
    step: "01",
    icon: Users,
    title: "Connect Wallet",
    desc: "Create a free account and link your Phantom, Solflare, or any Solana wallet.",
  },
  {
    step: "02",
    icon: PlayCircle,
    title: "Watch Videos",
    desc: "Browse curated educational content on DeFi, NFTs, Web3, and more.",
  },
  {
    step: "03",
    icon: Coins,
    title: "Earn SMT Tokens",
    desc: "Accumulate SMT rewards for every minute of genuine engagement.",
  },
  {
    step: "04",
    icon: TrendingUp,
    title: "Claim On-Chain",
    desc: "Withdraw your SMT directly to your wallet anytime, no waiting.",
  },
];

const FEATURES = [
  {
    icon: PlayCircle,
    title: "Watch & Earn",
    desc: "Every minutes of curated video earns you real SMT tokens – powered by Solana.",
    accent: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Shield,
    title: "Fraud-Proof",
    desc: "Tab-switch detection, playback-speed locks, and ML activity analysis keep rewards fair.",
    accent: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: Zap,
    title: "Streak Multiplier",
    desc: "Watch daily and build a streak up to a 2× multiplier. Consistency pays.",
    accent: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  {
    icon: Globe,
    title: "On-Chain, Always",
    desc: "SPL tokens on Solana mainnet. Your balance is verifiable by anyone, any time.",
    accent: "text-green-400",
    bg: "bg-green-400/10",
  },
];

const TOKEN_TIERS = [
  {
    tier: "Base Rate",
    rate: "1 SMT / min",
    color: "border-primary/40 bg-primary/5",
    badge: "bg-primary/20 text-primary",
    perks: ["Every completed video", "Instant queue credit", "No minimum watch time"],
  },
  {
    tier: "Streak Bonus",
    rate: "Up to 2× SMT",
    color: "border-orange-400/40 bg-orange-400/5",
    badge: "bg-orange-400/20 text-orange-400",
    perks: ["7-day streak: 1.5×", "30-day streak: 2×", "Protected by anti-cheat"],
  },
  {
    tier: "Referral",
    rate: "10% lifetime",
    color: "border-blue-400/40 bg-blue-400/5",
    badge: "bg-blue-400/20 text-blue-400",
    perks: ["Earn on every referral watch", "No cap on referrals", "Tracked on-chain"],
  },
];

const TESTIMONIALS = [
  {
    name: "0xAlex.sol",
    handle: "@0xalex_sol",
    text: "I've tried every W2E platform out there. SMT Watch is the only one that actually pays out consistently on-chain. Earned 800 SMT in my first week.",
    stars: 5,
  },
  {
    name: "CryptoNadia",
    handle: "@cryptonadia",
    text: "Love how the content is actually educational. I'm learning DeFi while earning tokens – it's the best combo. The streak multiplier is a game-changer.",
    stars: 5,
  },
  {
    name: "SolanaFarmer",
    handle: "@solanafarm",
    text: "Transparent, fair, and the anti-cheat system means everyone earns honestly. My trust level went sky-high when I saw on-chain proof of every payout.",
    stars: 5,
  },
];

const FAQS = [
  {
    q: "Is SMT Watch free to use?",
    a: "Yes, completely free. You just need a Solana wallet and an account to start earning.",
  },
  {
    q: "Which wallets are supported?",
    a: "Any Solana wallet — Phantom, Solflare, Backpack, Ledger, and more via Wallet Standard.",
  },
  {
    q: "When do I receive my SMT tokens?",
    a: "Rewards queue immediately after a video is completed. You can claim to your wallet any time.",
  },
  {
    q: "How does the anti-cheat system work?",
    a: "We monitor tab visibility, playback speed, and interaction patterns. Suspicious activity voids rewards for that session.",
  },
  {
    q: "What is SMT and where can I trade it?",
    a: "SMT is our Solana SPL token. You can trade it on any Solana DEX (Jupiter, Raydium) once you've claimed.",
  },
  {
    q: "Can I earn with a mobile device?",
    a: "Yes — our platform is fully responsive. Connect your mobile wallet and watch on any device.",
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const topEarners = await getTopEarners(5).catch(() => []);

  return (
    <div className="flex flex-col">
      {/* ── 1. Hero ── */}
      <section className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center py-20 px-4 text-center overflow-hidden">
        {/* radial glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 90% 60% at 50% -5%, oklch(0.88 0.20 96 / 0.18), transparent 70%)",
          }}
        />
        {/* hex grid overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 17.3 L60 34.6 L30 52 L0 34.6 L0 17.3Z' fill='none' stroke='white' stroke-width='0.6'/%3E%3C/svg%3E\")",
            backgroundSize: "60px 52px",
          }}
        />

        <Badge className="mb-6 bg-primary/15 text-primary border-primary/30 hover:bg-primary/20 gap-1">
          <Coins className="h-3.5 w-3.5" />
          Powered by Solana
        </Badge>

        <h1 className="text-5xl sm:text-[5.5rem] font-extrabold tracking-tight mb-6 leading-[1.05]">
          Watch.{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, oklch(0.88 0.20 96), oklch(0.70 0.20 50))" }}
          >
            Earn.
          </span>{" "}
          Grow.
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground mb-10 leading-relaxed">
          The first <strong className="text-foreground">Watch-to-Earn</strong> platform that turns
          educational crypto content into real <strong className="text-primary">SMT tokens</strong>{" "}
          on Solana — with fraud-proof rewards and transparent on-chain payouts.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-16">
          <Link
            href="/register"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-12 rounded-full px-8 text-base font-semibold gap-2"
            )}
          >
            Start Earning Free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/watch"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-12 rounded-full px-8 text-base font-semibold gap-2"
            )}
          >
            <PlayCircle className="h-4 w-4" />
            Browse Videos
          </Link>
        </div>

        <VideoCarousel />

        {/* scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground/40 animate-bounce">
          <ChevronDown className="h-5 w-5" />
        </div>
      </section>

      {/* ── 2. Stats Strip ── */}
      <section className="border-y border-border/40 bg-card/40">
        <div className="mx-auto max-w-5xl px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-black text-primary mb-1">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. How It Works ── */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Start Earning in 4 Steps
          </h2>
          <p className="text-center text-muted-foreground mb-14 max-w-xl mx-auto">
            No complex setup. No crypto experience required. Just watch and earn.
          </p>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 relative">
            {/* connector line */}
            <div
              aria-hidden
              className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
            />
            {STEPS.map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center relative">
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-black w-5 h-5 flex items-center justify-center rounded-full">
                    {step.replace("0", "")}
                  </span>
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Features ── */}
      <section className="py-24 px-4 bg-muted/10">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">Why SMT Watch?</h2>
          <p className="text-center text-muted-foreground mb-14 max-w-xl mx-auto">
            Built from the ground up to make every second of your watch time count.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, desc, accent, bg }) => (
              <Card
                key={title}
                className="border-border/50 bg-card/60 hover:border-primary/30 transition-all hover:-translate-y-0.5"
              >
                <CardContent className="p-6">
                  <div className={`inline-flex rounded-xl p-3 mb-4 ${bg}`}>
                    <Icon className={`h-5 w-5 ${accent}`} />
                  </div>
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Token Economics ── */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">Token Economics</h2>
          <p className="text-center text-muted-foreground mb-14 max-w-xl mx-auto">
            Three ways to maximize your SMT earnings — stack them all.
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {TOKEN_TIERS.map(({ tier, rate, color, badge, perks }) => (
              <Card key={tier} className={`border ${color}`}>
                <CardContent className="p-6">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badge} mb-4 inline-block`}>
                    {tier}
                  </span>
                  <p className="text-2xl font-black mb-4">{rate}</p>
                  <ul className="space-y-2">
                    {perks.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Top Earners ── */}
      {topEarners.length > 0 && (
        <section className="py-24 px-4 bg-muted/10">
          <div className="mx-auto max-w-lg">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 flex items-center justify-center gap-3">
              <Trophy className="h-7 w-7 text-primary" />
              Top Earners
            </h2>
            <p className="text-center text-muted-foreground mb-10">
              Real users, real on-chain payouts.
            </p>
            <Card className="border-border/50 overflow-hidden">
              {topEarners.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-5 py-3.5 border-b border-border/30 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg w-7 text-center">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </span>
                    <span className="font-medium">{entry.username}</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-sm text-primary font-bold">
                    <Coins className="h-3.5 w-3.5" />
                    {entry.total_earned.toFixed(2)} SMT
                  </span>
                </div>
              ))}
            </Card>
            <div className="text-center mt-6">
              <Link
                href="/leaderboard"
                className={cn(buttonVariants({ variant: "outline" }), "rounded-full gap-2")}
              >
                View Full Leaderboard <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── 7. Testimonials ── */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">What Earners Say</h2>
          <p className="text-center text-muted-foreground mb-14 max-w-xl mx-auto">
            Over 12,000 users trust SMT Watch for consistent on-chain rewards.
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map(({ name, handle, text, stars }) => (
              <Card key={name} className="border-border/50 bg-card/60">
                <CardContent className="p-6">
                  <div className="flex mb-3">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{text}"</p>
                  <div>
                    <p className="font-semibold text-sm">{name}</p>
                    <p className="text-xs text-muted-foreground">{handle}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. FAQ ── */}
      <section className="py-24 px-4 bg-muted/10">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-muted-foreground mb-14 max-w-xl mx-auto">
            Everything you need to know before watching your first video.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {FAQS.map(({ q, a }) => (
              <Card key={q} className="border-border/50 bg-card/60">
                <CardContent className="p-5">
                  <p className="font-semibold mb-2 text-sm">{q}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. CTA Banner ── */}
      <section className="py-24 px-4">
        <div
          className="mx-auto max-w-4xl rounded-2xl overflow-hidden relative text-center py-20 px-6"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.88 0.20 96 / 0.15), oklch(0.70 0.20 50 / 0.10))",
            border: "1px solid oklch(0.88 0.20 96 / 0.25)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 80% at 50% -20%, oklch(0.88 0.20 96 / 0.12), transparent)",
            }}
          />
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 relative">
            Ready to Start Earning?
          </h2>
          <p className="text-muted-foreground mb-10 max-w-lg mx-auto relative text-lg">
            Join 12,400+ earners. It's free, instant, and every reward is verifiable on-chain.
          </p>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-14 rounded-full px-10 text-lg font-bold gap-2 relative"
            )}
          >
            Create Free Account <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ── 10. Footer ── */}
      <footer className="border-t border-border/30 py-12 px-4">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
          <p className="font-bold text-foreground text-base">SMT Watch</p>
          <nav className="flex flex-wrap justify-center gap-6">
            <Link href="/watch" className="hover:text-primary transition-colors">Watch</Link>
            <Link href="/leaderboard" className="hover:text-primary transition-colors">Leaderboard</Link>
            <Link href="/register" className="hover:text-primary transition-colors">Register</Link>
            <Link href="/login" className="hover:text-primary transition-colors">Login</Link>
          </nav>
          <p>© {new Date().getFullYear()} SMT Watch. Built on Solana.</p>
        </div>
      </footer>
    </div>
  );
}

