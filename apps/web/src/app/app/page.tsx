import { redirect } from "next/navigation";
import { parseServerEnv } from "@rekko/shared/env";

import { AuthLayout } from "@/components/auth/auth-layout";
import { EmailVerificationCard } from "@/components/auth/email-verification-card";
import { getVerificationAccess } from "@/modules/auth/grace-period";
import { requireSession } from "@/modules/auth/session";
import { listUserWorkspaces } from "@/modules/workspaces/service";

export const metadata = { title: "Seu Workspace" };

export default async function AppPage() {
  const session = await requireSession("/app");
  const env = parseServerEnv(process.env);
  const access = getVerificationAccess({
    createdAt: session.user.createdAt,
    emailVerified: session.user.emailVerified,
    graceHours: env.EMAIL_VERIFICATION_GRACE_HOURS,
    now: new Date(),
  });
  if (access !== "blocked") {
    const workspaces = await listUserWorkspaces(session.user.id);
    if (workspaces[0]) redirect(`/w/${workspaces[0].slug}`);
    redirect("/onboarding/workspace");
  }
  return (
    <AuthLayout variant="verification">
      <EmailVerificationCard email={session.user.email} showSessionActions />
    </AuthLayout>
  );
}
