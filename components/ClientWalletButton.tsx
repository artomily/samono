"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Play, Clock, Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Dynamically import WalletMultiButton with no SSR to avoid hydration mismatch
const DynamicWalletButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false, loading: () => <div className="h-10 w-32 bg-muted rounded-md" /> }
);

export function ClientWalletButton() {
  return <DynamicWalletButton />;
}

// ---------------------------------------------------------------------------
// VideoCarousel
// ---------------------------------------------------------------------------

const SHOWCASE_VIDEOS = [
  {
    id: 1,
    title: "DeFi Explained: Yield Farming Strategies",
    category: "DeFi",
    duration: "18:34",
    reward: "45 SMT",
    rating: 4.9,
    thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=480&h=270&fit=crop",
  },
  {
    id: 2,
    title: "Solana NFT Masterclass for Creators",
    category: "NFTs",
    duration: "24:11",
    reward: "60 SMT",
    rating: 4.8,
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=480&h=270&fit=crop",
  },
  {
    id: 3,
    title: "Web3 Security: Protecting Your Assets",
    category: "Security",
    duration: "31:02",
    reward: "75 SMT",
    rating: 5.0,
    thumbnail: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=480&h=270&fit=crop",
  },
  {
    id: 4,
    title: "Smart Contract Auditing 101",
    category: "Dev",
    duration: "42:18",
    reward: "90 SMT",
    rating: 4.7,
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=480&h=270&fit=crop",
  },
  {
    id: 5,
    title: "Crypto Trading Psychology & Risk Mgmt",
    category: "Trading",
    duration: "27:55",
    reward: "55 SMT",
    rating: 4.8,
    thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=480&h=270&fit=crop",
  },
];

export function VideoCarousel() {
  const [active, setActive] = useState(2);
  const total = SHOWCASE_VIDEOS.length;

  const prev = () => setActive((i) => (i - 1 + total) % total);
  const next = () => setActive((i) => (i + 1) % total);

  const getIndex = (offset: number) => (active + offset + total) % total;

  return (
    <div className="relative w-full select-none">
      {/* cards */}
      <div className="flex items-center justify-center gap-4 py-6">
        {[-1, 0, 1].map((offset) => {
          const video = SHOWCASE_VIDEOS[getIndex(offset)];
          const isActive = offset === 0;
          return (
            <div
              key={video.id}
              onClick={() => {
                if (offset === -1) prev();
                if (offset === 1) next();
              }}
              className={cn(
                "relative rounded-xl overflow-hidden border transition-all duration-300 shrink-0 cursor-pointer",
                isActive
                  ? "w-80 md:w-96 opacity-100 scale-100 border-primary shadow-[0_0_32px_var(--smt-glow)] z-10"
                  : "w-52 md:w-64 opacity-40 scale-95 border-border hover:opacity-60"
              )}
            >
              {/* thumbnail */}
              <div className="relative aspect-video bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                {isActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                      <Play className="w-6 h-6 fill-primary-foreground text-primary-foreground ml-1" />
                    </div>
                  </div>
                )}
                <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">
                  {video.category}
                </span>
              </div>

              {/* info */}
              {isActive && (
                <div className="p-4 bg-card">
                  <p className="font-semibold text-foreground line-clamp-2 text-sm mb-2">{video.title}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {video.duration}
                    </span>
                    <span className="flex items-center gap-1 text-primary font-bold">
                      +{video.reward}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-primary text-primary" />
                      {video.rating}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* nav buttons */}
      <button
        onClick={prev}
        className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* dots */}
      <div className="flex justify-center gap-2 mt-2">
        {SHOWCASE_VIDEOS.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              i === active ? "bg-primary w-6" : "bg-muted-foreground/40"
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
