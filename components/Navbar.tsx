"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { ClientWalletButton } from "@/components/ClientWalletButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Menu, X, Coins, LayoutDashboard, PlayCircle, Trophy, Wallet, Users, Gift } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/watch", label: "Watch", icon: PlayCircle },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/dashboard/rewards", label: "Rewards", icon: Gift },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/referral", label: "Referral", icon: Users },
];

export function Navbar() {
  const pathname = usePathname();
  const { publicKey } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);

  const truncatedAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}`
    : null;

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        borderBottom: "1px solid rgba(0,229,255,0.12)",
        background: "#000",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl" style={{ color: "#00E5FF" }}>
          <Coins className="h-6 w-6" />
          <span
            style={{
              letterSpacing: "0.12em",
              textShadow: "0 0 22px rgba(0,229,255,0.5)",
              fontFamily: "var(--font-geist-mono), 'Courier New', monospace",
            }}
          >
            SAMONO
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-4">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-1.5 px-1 py-2 text-xs font-semibold tracking-[0.14em] transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "text-cyan-300"
                  : "text-cyan-100/40 hover:text-cyan-200"
              )}
              style={{ fontFamily: "var(--font-geist-mono), 'Courier New', monospace" }}
            >
              <Icon className="h-4 w-4" />
              {label}
              {(pathname === href || pathname.startsWith(href + "/")) && (
                <span
                  aria-hidden
                  className="absolute -bottom-2.5 left-0 right-0 h-px"
                  style={{ background: "#00E5FF" }}
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Wallet button - desktop */}
          <div className="hidden md:block">
            <ClientWalletButton />
          </div>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:ring-offset-1 focus:ring-offset-black hover:bg-cyan-400/10">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-cyan-400/15 text-cyan-300 text-xs font-bold">
                  {truncatedAddress ? truncatedAddress.slice(0, 2).toUpperCase() : "?"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-cyan-400/20 bg-black text-cyan-100">
              {truncatedAddress && (
                <>
                  <div className="px-2 py-1.5 text-xs text-cyan-200/55 font-mono">
                    {truncatedAddress}
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem>
                <Link href="/wallet">My Wallet</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/referral">Referral</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => signOut()}
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-cyan-200 hover:bg-cyan-400/10 hover:text-cyan-100"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-cyan-400/15 bg-black px-4 pb-4 pt-2">
          <nav className="flex flex-col gap-1 mb-4">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === href || pathname.startsWith(href + "/")
                    ? "bg-cyan-400/10 text-cyan-300"
                    : "text-cyan-100/45 hover:bg-cyan-400/10 hover:text-cyan-200"
                )}
                style={{ fontFamily: "var(--font-geist-mono), 'Courier New', monospace" }}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <ClientWalletButton />
        </div>
      )}
    </header>
  );
}
