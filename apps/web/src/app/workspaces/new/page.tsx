import { BrandMark } from "@/components/brand-mark";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { VerificationBanner } from "@/components/auth/verification-banner";
import { SessionActions } from "@/components/auth/session-actions";
import { WorkspaceForm } from "@/components/workspaces/workspace-form";
import { requireCoreSession } from "@/modules/auth/session";

export const metadata = { title: "Novo Workspace" };

export default async function NewWorkspacePage() {
  const session = await requireCoreSession("/workspaces/new");
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
        className="onboarding-panel"
        aria-labelledby="new-workspace-title"
      >
        <p className="onboarding-step">Novo Workspace</p>
        <h1 id="new-workspace-title">Crie outro espaço de trabalho.</h1>
        <p>
          Você poderá alternar entre seus Workspaces sem misturar membros ou
          permissões.
        </p>
        <WorkspaceForm />
      </section>
    </main>
  );
}
