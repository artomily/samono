"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DUMMY_MODE } from "@/lib/dummy";

export async function signOut() {
  if (DUMMY_MODE) {
    const cookieStore = await cookies();
    cookieStore.delete("dummy_auth");
    redirect("/");
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
