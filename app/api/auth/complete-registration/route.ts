import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { DUMMY_MODE } from "@/lib/dummy";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { username?: string; referralCode?: string };
    const { username, referralCode } = body;

    if (!username || !USERNAME_RE.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3–20 characters: letters, numbers, underscores only." },
        { status: 400 }
      );
    }

    const clean = username.toLowerCase();

    // Resolve current user
    let userId: string;
    if (DUMMY_MODE) {
      const { DUMMY_USER } = await import("@/lib/dummy");
      userId = DUMMY_USER.id;
    } else {
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
      }
      userId = user.id;
    }

    const service = createServiceClient();

    // Check username uniqueness
    const { data: existing } = await service
      .from("profiles")
      .select("id")
      .eq("username", clean)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }

    // Resolve optional referral code → referrer_id
    let referrerId: string | null = null;
    if (referralCode && referralCode.trim()) {
      const { data: referrer } = await service
        .from("profiles")
        .select("id")
        .eq("username", referralCode.toLowerCase().trim())
        .maybeSingle();
      if (referrer) referrerId = referrer.id;
    }

    // Update profile — only if username is still null (prevents overwrite)
    const { error: updateError } = await service
      .from("profiles")
      .update(referrerId ? { username: clean, referrer_id: referrerId } : { username: clean })
      .eq("id", userId)
      .is("username", null);

    if (updateError) {
      return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
