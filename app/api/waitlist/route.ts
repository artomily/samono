import { type NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

function getAuthRedirectUrl(request: NextRequest) {
  const configuredBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL;

  const baseUrl = configuredBaseUrl
    ? configuredBaseUrl.startsWith("http")
      ? configuredBaseUrl
      : `https://${configuredBaseUrl}`
    : request.nextUrl.origin;

  return new URL("/register?source=waitlist", baseUrl).toString();
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email =
    typeof body === "object" &&
    body !== null &&
    "email" in body &&
    typeof (body as Record<string, unknown>).email === "string"
      ? ((body as Record<string, unknown>).email as string).trim().toLowerCase()
      : "";

  // Basic email format validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 422 });
  }

  const supabase = await createClient();

  // waitlist_emails is a new table not yet in the generated Database types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("waitlist_emails").insert({ email });

  if (error) {
    // Unique constraint violation — already on the list
    if (error.code === "23505") {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    console.error("[waitlist] insert error:", error.message);
    return NextResponse.json({ error: "Failed to add to waitlist" }, { status: 500 });
  }

  // Fire and forget: if email fails, we still keep successful waitlist registration.
  try {
    const service = createServiceClient();
    const { error: inviteError } = await service.auth.admin.inviteUserByEmail(email, {
      redirectTo: getAuthRedirectUrl(request),
      data: {
        source: "waitlist",
      },
    });

    if (inviteError) {
      console.error("[waitlist] invite email error:", inviteError.message);
    }
  } catch (inviteException) {
    console.error("[waitlist] invite email exception:", inviteException);
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
