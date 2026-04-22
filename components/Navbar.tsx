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
import { Menu, X, Coins, LayoutDashboard, PlayCircle, Trophy, Wallet, Users } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/watch", label: "Watch", icon: PlayCircle },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
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
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Coins className="h-6 w-6 text-primary" />
          <span className="bg-linear-to-r from-primary to-zinc-900 bg-clip-text text-transparent">
            SAMONO
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
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
            <DropdownMenuTrigger className="rounded-full hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                  {truncatedAddress ? truncatedAddress.slice(0, 2).toUpperCase() : "?"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {truncatedAddress && (
                <>
                  <div className="px-2 py-1.5 text-xs text-muted-foreground font-mono">
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
            className="md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background px-4 pb-4 pt-2">
          <nav className="flex flex-col gap-1 mb-4">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === href || pathname.startsWith(href + "/")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
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
