"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Coins, Loader2 } from "lucide-react";
import { signUp } from "@/lib/auth/actions";
import { Suspense } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full font-semibold" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? "Creating account…" : "Create Account"}
    </Button>
  );
}

function RegisterFormInner() {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref") ?? "";
  const [state, formAction] = useActionState(signUp, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          type="text"
          placeholder="yourname"
          autoComplete="username"
          required
          minLength={3}
          maxLength={20}
          pattern="[a-zA-Z0-9_]+"
          title="Letters, numbers and underscores only"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Min 8 characters"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="referral_code">
          Referral Code{" "}
          <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Input
          id="referral_code"
          name="referral_code"
          type="text"
          placeholder="Friend's username"
          defaultValue={referralCode}
        />
      </div>

      <SubmitButton />
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm border-border/50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Coins className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Join SMT Watch</CardTitle>
          <CardDescription>Create an account and start earning tokens</CardDescription>
        </CardHeader>

        <CardContent>
          <Suspense fallback={<div className="h-48 animate-pulse bg-muted rounded-md" />}>
            <RegisterFormInner />
          </Suspense>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
