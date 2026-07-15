import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import { createHmac } from "crypto";
import { Keypair, StrKey } from "@stellar/stellar-sdk";
import type { Database } from "@/types/database";
import { DUMMY_MODE, DUMMY_WALLET } from "@/lib/dummy";

const WALLET_AUTH_SECRET =
  process.env.WALLET_AUTH_SECRET ?? "dev-secret-change-in-prod";

const bodySchema = z.object({
  publicKey: z.string().regex(/^G[A-Z2-7]{55}$/).optional(),
  signature: z.string().optional(),
  timestamp: z.number().optional(),
  referralCode: z.string().optional(),
});

function walletToEmail(publicKey: string) {
  return `${publicKey.toLowerCase()}@wallet.xlm`;
}

function walletToPassword(publicKey: string) {
  return createHmac("sha256", WALLET_AUTH_SECRET)
    .update(publicKey)
    .digest("hex");
}

/**
 * Verify a Stellar wallet signature over the login message.
 *
 * Stellar accounts are ed25519 keys, so we verify the raw signature against the
 * UTF-8 message bytes using the account's public key. Stellar Wallets Kit's
 * `signMessage` returns a signature whose encoding is wallet-dependent
 * (Freighter/Albedo use base64); we try base64 first, then hex, then base64url.
 */
function verifyStellarSignature(
  address: string,
  message: string,
  signature: string
): boolean {
  try {
    if (!StrKey.isValidEd25519PublicKey(address)) return false;
    const kp = Keypair.fromPublicKey(address);
    const msgBuf = Buffer.from(message, "utf8");

    const candidates: Buffer[] = [];
    for (const enc of ["base64", "hex", "base64url"] as const) {
      try {
        candidates.push(Buffer.from(signature, enc));
      } catch {
        /* skip invalid encoding */
      }
    }
    return candidates.some((sig) => sig.length === 64 && kp.verify(msgBuf, sig));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  // Dummy mode — skip all Supabase auth, just set a cookie
  if (DUMMY_MODE) {
    let walletAddress = DUMMY_WALLET;
    try {
      const body = await req.json();
      walletAddress = body?.publicKey ?? DUMMY_WALLET;
    } catch { /* ignore */ }
    const res = NextResponse.json({ ok: true, dummy: true });
    res.cookies.set("dummy_auth", walletAddress, { httpOnly: true, path: "/", sameSite: "lax" });
    return res;
  }

  console.log("[Auth] Wallet auth endpoint called");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { publicKey, signature, timestamp, referralCode } = parsed.data;

  // Validate publicKey is required
  if (!publicKey) {
    return NextResponse.json(
      { error: "publicKey is required for wallet authentication" },
      { status: 400 }
    );
  }

  const walletAddress = publicKey

  // Signature verification
  if (!signature || !timestamp) {
      return NextResponse.json({ error: "Signature and timestamp required" }, { status: 400 });
    }
    // Reject stale timestamps (5-minute window)
    if (Math.abs(Date.now() - timestamp) > 5 * 60 * 1000) {
      return NextResponse.json({ error: "Signature expired — please try again" }, { status: 400 });
    }

    try {
      const message = `Samono Login\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}`;
      const valid = verifyStellarSignature(walletAddress, message, signature);
      if (!valid) {
        return NextResponse.json({ error: "Invalid wallet signature" }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
    }

  const email = walletToEmail(walletAddress);
  const password = walletToPassword(walletAddress);

  // Validate environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("Missing Supabase config");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing service role key");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const serviceClient = createServiceClient();

  // Try to get or create user
  let userId: string;
  let isNewUser = false;

  // Try to sign in first with anonClient
  const anonClient = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });

  console.log(`[Auth] First sign-in attempt for ${email.slice(0, 8)}...`);
  console.log(`[Auth] Success: ${!!signInData?.session}, Error: ${signInError?.message || "none"}`);

  if (signInData?.session) {
    console.log("[Auth] User already exists, returning existing session");
    // Check if the existing user still needs to complete registration (no username yet)
    const { data: existingProfile } = await serviceClient
      .from("profiles")
      .select("username")
      .eq("id", signInData.session.user.id)
      .maybeSingle();
    const needsRegistration = !existingProfile?.username;
    return NextResponse.json({
      ...(needsRegistration && { isNewUser: true }),
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
      expires_at: signInData.session.expires_at,
    });
  }

  // User doesn't exist — create them
  if (signInError?.status === 400) {
    console.log("[Auth] User not found (400), creating new user...");
    isNewUser = true;

    const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { wallet_address: walletAddress },
    });

    if (createError || !newUser.user) {
      console.error("[Auth] Failed to create user:", createError);
      return NextResponse.json(
        {
          error: "Failed to create account",
          detail: createError?.message ?? "No user returned",
          code: createError?.status ?? 500,
        },
        { status: 500 }
      );
    }

    console.log(`[Auth] New user created: ${newUser.user.id}`);
    userId = newUser.user.id;

    // Resolve referral code → referrer_id
    let referrerId: string | null = null;
    if (referralCode) {
      const { data: referrer } = await serviceClient
        .from("profiles")
        .select("id, xp")
        .eq("username", referralCode)
        .single();
      referrerId = referrer?.id ?? null;

      // Grant referrer 10,000 bonus points
      if (referrerId) {
        const currentXp = referrer?.xp ?? 0;
        await serviceClient
          .from("profiles")
          .update({ xp: currentXp + 10000 })
          .eq("id", referrerId);
        console.log(`[Auth] Granted 10,000 XP to referrer ${referrerId}`);
      }
    }

    // Create profile row (basic fields only — xp is set separately below)
    const { error: profileError } = await serviceClient.from("profiles").upsert(
      {
        id: userId,
        wallet_address: walletAddress,
        username: null,
        avatar_url: null,
        last_watch_date: null,
        referrer_id: referrerId,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error("Failed to create profile:", profileError.message, profileError.code);
      // Profile may have been created by the trigger — continue anyway
    }

    // Grant 5000 XP welcome bonus (separate query so profile creation never depends on xp column)
    const { error: xpError } = await serviceClient
      .from("profiles")
      .update({ xp: 5000 })
      .eq("id", userId)
      .eq("xp", 0);
    if (xpError) {
      console.warn("[Auth] Could not set welcome XP (column may not exist yet):", xpError.message);
    }

    // Sign in with the newly created credentials (with retry for timing issues)
    let signInAfterCreate = null;
    let signInAfterError = null;
    let retries = 3;

    console.log("[Auth] Attempting to sign in after user creation (with retries)...");

    while (retries > 0) {
      console.log(`[Auth] Sign-in retry attempt ${4 - retries}`);
      const result = await anonClient.auth.signInWithPassword({
        email,
        password,
      });

      if (result.data?.session) {
        signInAfterCreate = result.data;
        console.log("[Auth] Sign-in succeeded after user creation");
        break;
      }

      signInAfterError = result.error;
      console.log(`[Auth] Sign-in attempt failed: ${result.error?.message}`);
      retries--;

      if (retries > 0) {
        // Wait a bit before retrying (50ms per attempt)
        await new Promise((resolve) => setTimeout(resolve, 50 * (4 - retries)));
      }
    }

    if (!signInAfterCreate?.session) {
      console.error("[Auth] Failed to sign in after user creation:", signInAfterError);
      return NextResponse.json(
        {
          error: "Failed to create session after user creation",
          detail: signInAfterError?.message ?? "Unknown error",
          code: signInAfterError?.status ?? 500,
        },
        { status: 500 }
      );
    }

    console.log("[Auth] New user signed in successfully");
    return NextResponse.json({
      isNewUser: true,
      access_token: signInAfterCreate.session.access_token,
      refresh_token: signInAfterCreate.session.refresh_token,
      expires_at: signInAfterCreate.session.expires_at,
    });
  }

  // Some other error occurred (not 400 = not "user not found")
  if (signInError) {
    console.error("[Auth] Unexpected sign-in error:", signInError);
    return NextResponse.json(
      {
        error: signInError.message || "Authentication failed",
        detail: signInError.message,
        code: signInError.status,
      },
      { status: 401 }
    );
  }

  console.error("[Auth] Reached unexpected end of function");
  return NextResponse.json(
    { error: "Authentication failed", detail: "Reached unexpected end of function" },
    { status: 500 }
  );
}
