import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SMT Watch — Watch to Earn",
    template: "%s | SMT Watch",
  },
  description:
    "Watch videos from our channel and earn SMT tokens on Solana. Real rewards, real blockchain.",
  keywords: ["watch to earn", "solana", "SMT token", "web3", "crypto rewards"],
  openGraph: {
    title: "SMT Watch — Watch to Earn",
    description: "Watch videos and earn SMT tokens on Solana.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}

