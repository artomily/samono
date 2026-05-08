import { NextRequest, NextResponse } from "next/server";

/** Temporary debug endpoint — remove after diagnosing env issues */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  return NextResponse.json({
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "MISSING",
    service_role_key: {
      present: !!serviceKey,
      length: serviceKey.length,
      prefix: serviceKey.slice(0, 30),
      suffix: serviceKey.slice(-10),
    },
    anon_key: {
      present: !!anonKey,
      length: anonKey.length,
      prefix: anonKey.slice(0, 30),
    },
    wallet_auth_secret_set: !!process.env.WALLET_AUTH_SECRET,
    treasury_keypair_set: !!process.env.TREASURY_WALLET_KEYPAIR,
    node_env: process.env.NODE_ENV,
  });
}
