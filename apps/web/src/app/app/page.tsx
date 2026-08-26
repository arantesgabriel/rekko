import Link from "next/link";
import { redirect } from "next/navigation";
import { parseServerEnv } from "@rekko/shared/env";

import { SessionActions } from "@/components/auth/session-actions";
import { BrandMark } from "@/components/brand-mark";
import { ThemeSwitcher } from "@/components/theme-switcher";
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
    <div className="account-shell">
      <header className="account-header">
        <BrandMark />
        <ThemeSwitcher />
      </header>
      <main className="account-main">
        <section className="verification-gate">
          <div className="segment-mark segment-mark--brand" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h1>Confirme seu email para continuar.</h1>
          <p>
            Confirme <strong>{session.user.email}</strong> para entrar no core
            do Rekko.
          </p>
          <Link
            className="button button--primary"
            href={`/verify-email?email=${encodeURIComponent(session.user.email)}`}
          >
            Confirmar ou reenviar email
          </Link>
          <SessionActions />
        </section>
      </main>
    </div>
  );
}
