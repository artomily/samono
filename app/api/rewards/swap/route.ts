import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { getProfileById } from "@/lib/dal/profiles";
import { createServiceClient } from "@/lib/supabase/server";
import { transferSOL } from "@/lib/solana/token";
import { SWAP_OPTIONS } from "@/lib/constants/swap";

const bodySchema = z.object({
  optionId: z.string(),
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

  const option = SWAP_OPTIONS.find((o) => o.id === parsed.data.optionId);
  if (!option) {
    return NextResponse.json({ success: false, error: "Invalid swap option" }, { status: 400 });
  }

  const profile = await getProfileById(user.id);
  if (!profile) {
    return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
  }

  if (!profile.wallet_address) {
    return NextResponse.json(
      { success: false, error: "No wallet connected. Please connect your wallet first.", code: "NO_WALLET" },
      { status: 400 }
    );
  }

  if ((profile.xp ?? 0) < option.pointsCost) {
    return NextResponse.json(
      { success: false, error: "Insufficient points balance", code: "INSUFFICIENT_POINTS" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Deduct points atomically — the `.gte("xp", option.pointsCost)` guard prevents
  // double-spend if two requests race.
  const { error: deductError, count } = await supabase
    .from("profiles")
    .update({ xp: (profile.xp ?? 0) - option.pointsCost })
    .eq("id", user.id)
    .gte("xp", option.pointsCost);

  if (deductError || count === 0) {
    return NextResponse.json({ success: false, error: "Failed to deduct points — balance may have changed" }, { status: 409 });
  }

  // Transfer SOL from treasury to user's wallet
  const transfer = await transferSOL(profile.wallet_address, option.solAmount);

  if (!transfer.success) {
    // Rollback points deduction
    await supabase
      .from("profiles")
      .update({ xp: profile.xp ?? 0 })
      .eq("id", user.id);
    return NextResponse.json(
      { success: false, error: `SOL transfer failed: ${transfer.error}` },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      pointsDeducted: option.pointsCost,
      solAmount: option.solAmount,
      newPointsBalance: (profile.xp ?? 0) - option.pointsCost,
      txSignature: transfer.signature,
      walletAddress: profile.wallet_address,
      message: `${option.solAmount} SOL sent to your wallet!`,
    },
  });
}
