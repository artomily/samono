import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that require authentication — all unauthenticated hits go to /dashboard (login overlay)
const PROTECTED_PATHS = ["/dashboard", "/watch", "/wallet", "/leaderboard", "/referral", "/register"];

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const pathname = request.nextUrl.pathname;

  // ── Subdomain routing (production only) ──────────────────────────────────
  const isLocalDev =
    hostname.startsWith("localhost") ||
    hostname.startsWith("127.0.0.1") ||
    hostname.startsWith("::1");

  if (!isLocalDev) {
    const isLandingDomain = hostname === "samono.com" || hostname === "www.samono.com";
    const isAppDomain = hostname === "apps.samono.com";

    if (isLandingDomain) {
      // Only the landing page and waitlist API are served from the main domain
      const isAllowedOnLanding =
        pathname === "/" || pathname.startsWith("/api/waitlist");
      if (!isAllowedOnLanding) {
        const target = new URL(`https://apps.samono.com${pathname}`);
        target.search = request.nextUrl.search;
        return NextResponse.redirect(target, { status: 302 });
      }
      return NextResponse.next();
    }

    if (isAppDomain && pathname === "/") {
      return NextResponse.redirect(new URL("https://samono.com"), { status: 302 });
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const { supabaseResponse, user } = await updateSession(request);

  // Require auth for protected routes — show login overlay via /dashboard
  if (!user && PROTECTED_PATHS.some((p) => pathname.startsWith(p)) && pathname !== "/dashboard") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
