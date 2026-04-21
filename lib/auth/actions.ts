"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = signInSchema.extend({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(24, "Username too long")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  referralCode: z.string().optional(),
});

export type SignInState = { error?: string } | null;
export type SignUpState = { error?: string; fieldErrors?: Record<string, string[]> } | null;

export async function signIn(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Invalid email or password" };
  }

  redirect("/dashboard");
}

export async function signUp(
  _prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    username: formData.get("username"),
    referralCode: formData.get("referralCode") ?? undefined,
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return { fieldErrors };
  }

  const supabase = await createClient();

  // Check username uniqueness
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", parsed.data.username)
    .single();

  if (existing) {
    return { fieldErrors: { username: ["Username already taken"] } };
  }

  // Resolve referral code to a user id (referral code = username)
  let referrerId: string | null = null;
  if (parsed.data.referralCode) {
    const { data: referrer } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", parsed.data.referralCode)
      .single();
    referrerId = referrer?.id ?? null;
  }

  const { error: signUpError } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        username: parsed.data.username,
        referrer_id: referrerId,
      },
    },
  });

  if (signUpError) {
    if (signUpError.message.toLowerCase().includes("already registered")) {
      return { error: "An account with this email already exists" };
    }
    return { error: "Registration failed. Please try again." };
  }

  // Update profile with referrer_id if provided
  if (referrerId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ referrer_id: referrerId })
        .eq("id", user.id);
    }
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
