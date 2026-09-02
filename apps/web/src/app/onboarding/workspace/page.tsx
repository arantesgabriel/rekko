import { redirect } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { OnboardingAccountMenu } from "@/components/workspaces/onboarding-account-menu";
import { OnboardingWizard } from "@/components/workspaces/onboarding-wizard";
import { requireCoreSession } from "@/modules/auth/session";
import {
  getUserTimezone,
  listUserWorkspaces,
} from "@/modules/workspaces/service";

export const metadata = { title: "Crie seu Workspace" };

export default async function WorkspaceOnboardingPage() {
  const session = await requireCoreSession("/onboarding/workspace");
  const existing = await listUserWorkspaces(session.user.id);
  if (existing[0]) redirect(`/w/${existing[0].slug}`);
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
