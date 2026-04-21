import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Profile } from "@/types/database";
import { DUMMY_MODE, DUMMY_USER } from "@/lib/dummy";

/**
 * Returns the current user session or null.
 * Safe to call from Server Components.
 */
export async function getSession() {
  if (DUMMY_MODE) {
    const cookieStore = await cookies();
    return cookieStore.has("dummy_auth") ? DUMMY_USER : null;
  }
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * Returns the current user or redirects to /login.
 * Use in protected Server Components.
 */
export async function requireAuth() {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

/**
 * Returns the current user's profile row.
 */
export async function getProfile(): Promise<Profile | null> {
  const user = await getSession();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}
