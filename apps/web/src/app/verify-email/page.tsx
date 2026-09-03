import { AuthLayout } from "@/components/auth/auth-layout";

import { EmailVerificationCard } from "@/components/auth/email-verification-card";

export const metadata = { title: "Confirmar e-mail" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string | string[];
    token?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : undefined;
  const token = typeof params.token === "string" ? params.token : undefined;

  return (
    <AuthLayout variant="verification">
      <EmailVerificationCard email={email} token={token} />
    </AuthLayout>
  );
}
