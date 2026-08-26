import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { VerificationBanner } from "@/components/auth/verification-banner";
import { SessionActions } from "@/components/auth/session-actions";
import { InviteForm } from "@/components/workspaces/invite-form";
import { requireCoreSession } from "@/modules/auth/session";
import { requireWorkspace } from "@/modules/workspaces/service";

export const metadata = { title: "Convide seu time" };

export default async function InviteOnboardingPage({
  params,
}: PageProps<"/onboarding/[workspaceSlug]/invite">) {
  const { workspaceSlug } = await params;
  const session = await requireCoreSession(
    `/onboarding/${workspaceSlug}/invite`,
  );
  const current = await requireWorkspace(
    session.user.id,
    workspaceSlug,
    "invitation:manage",
  );
  return (
    <main className="onboarding-shell">
      <header className="onboarding-header">
        <BrandMark />
        <div className="onboarding-header__actions">
          <ThemeSwitcher />
          <SessionActions />
        </div>
      </header>
      <VerificationBanner user={session.user} />
      <section
        className="onboarding-panel onboarding-panel--wide"
        aria-labelledby="invite-title"
      >
        <div className="onboarding-progress" aria-label="Etapa 2 de 3">
          <span className="is-done" />
          <span className="is-active" />
          <span />
        </div>
        <p className="onboarding-step">Etapa 2 de 3 · {current.name}</p>
        <h1 id="invite-title">Quer trazer seu time?</h1>
        <p>
          Convide alguém agora ou siga em frente. Você poderá voltar a Members
          quando quiser.
        </p>
        <InviteForm slug={workspaceSlug} />
        <Link
          className="skip-link"
          href={`/onboarding/${workspaceSlug}/project`}
        >
          Pular por agora
        </Link>
      </section>
    </main>
  );
}
