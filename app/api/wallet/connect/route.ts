import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { saveWalletAddress } from "@/lib/dal/profiles";
import { createServiceClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  walletAddress: z.string().min(32).max(44),
  walletType: z.enum(["phantom", "solflare", "other"]).default("other"),
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

  const supabase = createServiceClient();

  // Upsert wallet connection record
  await supabase.from("wallet_connections").upsert(
    {
      user_id: user.id,
      wallet_address: parsed.data.walletAddress,
      wallet_type: parsed.data.walletType,
      is_primary: true,
    },
    { onConflict: "user_id,wallet_address" }
  );

  // Set all other connections to non-primary
  await supabase
    .from("wallet_connections")
    .update({ is_primary: false })
    .eq("user_id", user.id)
    .neq("wallet_address", parsed.data.walletAddress);

  // Update profile primary wallet
  await saveWalletAddress(user.id, parsed.data.walletAddress);

  return NextResponse.json({ success: true, data: { walletAddress: parsed.data.walletAddress } });
}
