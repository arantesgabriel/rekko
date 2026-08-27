import { BrandMark } from "@/components/brand-mark";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { OnboardingAccountMenu } from "@/components/workspaces/onboarding-account-menu";
import { OnboardingWizard } from "@/components/workspaces/onboarding-wizard";
import { requireCoreSession } from "@/modules/auth/session";
import { getUserTimezone } from "@/modules/workspaces/service";

export const metadata = { title: "Novo Workspace" };

export default async function NewWorkspacePage() {
  const session = await requireCoreSession("/workspaces/new");
  const timezone = await getUserTimezone(session.user.id);
  return (
    <main className="onboarding-shell">
      <header className="onboarding-header">
        <BrandMark />
        <div className="onboarding-header__actions">
          <ThemeSwitcher />
          <OnboardingAccountMenu name={session.user.name} />
        </div>
      </header>
      <OnboardingWizard timezone={timezone} />
    </main>
  );
}
