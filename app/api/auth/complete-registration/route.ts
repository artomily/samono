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
    const { data: updated, error: updateError } = await service
      .from("profiles")
      .update(referrerId ? { username: clean, referrer_id: referrerId } : { username: clean })
      .eq("id", userId)
      .is("username", null)
      .select("id");

    if (updateError) {
      console.error("[Registration] Update error:", updateError);
      return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
    }

    // If 0 rows were updated the profile row may be missing (trigger didn't fire) — create it now
    if (!updated || updated.length === 0) {
      const { data: existingProfile } = await service
        .from("profiles")
        .select("id, username")
        .eq("id", userId)
        .maybeSingle();

      if (!existingProfile) {
        // Profile row missing entirely — insert it
        const { error: insertError } = await service
          .from("profiles")
          .insert({
            id: userId,
            username: clean,
            ...(referrerId ? { referrer_id: referrerId } : {}),
          });
        if (insertError) {
          console.error("[Registration] Failed to insert profile:", insertError);
          return NextResponse.json({ error: "Couldn't save your username. Please try again." }, { status: 500 });
        }
      } else if (existingProfile.username) {
        return NextResponse.json({ error: "Your username is already set." }, { status: 409 });
      }
      // else: profile exists but username still null — update somehow returned 0; treat as success
    }

    // Grant 5000 XP welcome bonus if not yet set
    await service.from("profiles").update({ xp: 5000 }).eq("id", userId).eq("xp", 0);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
