export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { getProfile } from "@/lib/dal/profiles";
import { RegisterForm } from "@/components/RegisterForm";

export default async function RegisterPage() {
  const user = await requireAuth();
  const profile = await getProfile(user.id);

  // Already has a username — skip to dashboard
  if (profile?.username) redirect("/dashboard");

  return <RegisterForm />;
}
