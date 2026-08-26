import { redirect } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { VerificationBanner } from "@/components/auth/verification-banner";
import { SessionActions } from "@/components/auth/session-actions";
import { WorkspaceForm } from "@/components/workspaces/workspace-form";
import { requireCoreSession } from "@/modules/auth/session";
import { listUserWorkspaces } from "@/modules/workspaces/service";

export const metadata = { title: "Crie seu Workspace" };

export default async function WorkspaceOnboardingPage() {
  const session = await requireCoreSession("/onboarding/workspace");
  const existing = await listUserWorkspaces(session.user.id);
  if (existing[0]) redirect(`/w/${existing[0].slug}`);
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
      <section className="onboarding-panel" aria-labelledby="onboarding-title">
        <div className="onboarding-progress" aria-label="Etapa 1 de 2">
          <span className="is-active" />
          <span />
        </div>
        <p className="onboarding-step">Etapa 1 de 2</p>
        <h1 id="onboarding-title">Onde seu tempo acontece?</h1>
        <p>
          Crie um Workspace para organizar pessoas e, nas próximas fases,
          projetos e tarefas.
        </p>
        <WorkspaceForm />
      </section>
    </main>
  );
}
