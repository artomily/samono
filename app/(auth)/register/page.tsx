import { redirect } from "next/navigation";

// Registration is now automatic — connecting your wallet creates an account.
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const params = await searchParams;
  const ref = params.ref ? `?ref=${params.ref}` : "";
  redirect(`/login${ref}`);
}
