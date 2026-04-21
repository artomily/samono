import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DUMMY_MODE, DUMMY_USER } from "@/lib/dummy";

export async function updateSession(request: NextRequest) {
  // Dummy mode — skip Supabase entirely, use a simple cookie for auth
  if (DUMMY_MODE) {
    const supabaseResponse = NextResponse.next({ request });
    const user = request.cookies.has("dummy_auth") ? DUMMY_USER : null;
    return { supabaseResponse, user };
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do NOT remove this
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
