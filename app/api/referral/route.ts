import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getReferralStats } from "@/lib/dal/profiles";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getReferralStats(user.id);
  return NextResponse.json(stats);
}
