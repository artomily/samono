import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { processClaimRequest } from "@/services/reward-engine";
import { getPendingRewards } from "@/lib/dal/rewards";

const bodySchema = z.object({
  walletAddress: z
    .string()
    .min(32, "Invalid wallet address")
    .max(44, "Invalid wallet address"),
});

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Check if there's anything to claim
  const pending = await getPendingRewards(user.id);
  if (pending.length === 0) {
    return NextResponse.json(
      { success: false, error: "No pending rewards to claim", code: "NOTHING_TO_CLAIM" },
      { status: 400 }
    );
  }

  try {
    const result = await processClaimRequest(user.id, parsed.data.walletAddress);
    return NextResponse.json({
      success: true,
      data: {
        claimed: result.claimed,
        total: result.total,
        signatures: result.signatures,
        explorerLinks: result.signatures.map(
          (sig) =>
            `https://solscan.io/tx/${sig}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet"}`
        ),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Claim failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
