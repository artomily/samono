import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTopEarners } from "@/lib/dal/leaderboard";
import {
  PlayCircle,
  Coins,
  Shield,
  Zap,
  TrendingUp,
  ArrowRight,
  Trophy,
} from "lucide-react";

const FEATURES = [
  {
    icon: PlayCircle,
    title: "Watch & Earn",
    description:
      "Watch curated videos from our official channel and earn SMT tokens for every minute you engage.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Shield,
    title: "Fraud-Proof",
    description:
      "Advanced anti-cheat: tab-switch detection, speed change tracking, and activity monitoring.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: Zap,
    title: "Streak Multiplier",
    description:
      "Watch daily to build streaks up to 2× reward multiplier. Consistency is rewarded.",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  {
    icon: TrendingUp,
    title: "On-Chain Rewards",
    description:
      "Real SPL tokens on Solana. Claim directly to your Phantom or Solflare wallet.",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
];

const STEPS = [
  { step: "01", title: "Register & Connect Wallet", desc: "Create an account and link your Solana wallet." },
  { step: "02", title: "Watch Videos", desc: "Browse the video library and watch to completion." },
  { step: "03", title: "Earn SMT", desc: "Rewards accumulate in your queue after each completed video." },
  { step: "04", title: "Claim Anytime", desc: "Hit Claim and receive SMT tokens directly on-chain." },
];

export default async function LandingPage() {
  const topEarners = await getTopEarners(5).catch(() => []);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center py-24 px-4 text-center overflow-hidden">
        {/* Background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(var(--primary)/0.15), transparent)",
          }}
        />

        <Badge className="mb-6 bg-primary/10 text-primary border-primary/30 hover:bg-primary/20">
          <Coins className="mr-1 h-3.5 w-3.5" />
          Powered by Solana
        </Badge>

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Watch.{" "}
          <span className="bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent">
            Earn.
          </span>{" "}
          Grow.
        </h1>

        <p className="max-w-xl text-lg text-muted-foreground mb-10 leading-relaxed">
          Turn your watch time into real <strong className="text-foreground">SMT tokens</strong> on
          Solana. The only Watch-to-Earn platform that rewards genuine engagement.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button render={<Link href="/register" />} size="lg" className="font-semibold px-8 text-base">
            Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button render={<Link href="/watch" />} size="lg" variant="outline" className="font-semibold px-8 text-base">
            Browse Videos
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-4">Why SMT Watch?</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            We built the infrastructure to make Watch-to-Earn fair, transparent, and genuinely
            rewarding.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, description, color, bg }) => (
              <Card key={title} className="border-border/50 bg-card/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className={`inline-flex rounded-lg p-2.5 mb-4 ${bg}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div className="text-4xl font-black text-primary/30 mb-2 font-mono">{step}</div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mini leaderboard */}
      {topEarners.length > 0 && (
        <section className="py-20 px-4">
          <div className="mx-auto max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-400" />
                Top Earners
              </h2>
              <Button render={<Link href="/leaderboard" />} variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
            <Card className="border-border/50 overflow-hidden">
              {topEarners.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3 border-b border-border/30 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg w-6 text-center">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </span>
                    <span className="font-medium">{entry.username}</span>
                  </div>
                  <span className="flex items-center gap-1 text-sm text-primary font-semibold">
                    <Coins className="h-3.5 w-3.5" />
                    {entry.total_earned.toFixed(2)}
                  </span>
                </div>
              ))}
            </Card>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24 px-4 text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to Start Earning?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Join thousands of users already earning SMT tokens. It's free, instant, and on-chain.
        </p>
        <Button render={<Link href="/register" />} size="lg" className="font-semibold px-10 text-base">
          Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} SMT Watch. Built on Solana.</p>
      </footer>
    </div>
  );
}

