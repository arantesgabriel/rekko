import Link from "next/link";

import { SessionActions } from "@/components/auth/session-actions";
import { VerificationBanner } from "@/components/auth/verification-banner";
import { BrandMark } from "@/components/brand-mark";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { WorkspaceSwitcher } from "@/components/workspaces/workspace-switcher";
import { requireCoreSession } from "@/modules/auth/session";
import {
  listUserWorkspaces,
  requireWorkspace,
} from "@/modules/workspaces/service";

export default async function WorkspaceLayout({
  children,
  params,
}: LayoutProps<"/w/[workspaceSlug]">) {
  const { workspaceSlug } = await params;
  const session = await requireCoreSession(`/w/${workspaceSlug}`);
  const [current, workspaces] = await Promise.all([
    requireWorkspace(session.user.id, workspaceSlug),
    listUserWorkspaces(session.user.id),
  ]);
  return (
    <div className="product-shell">
      <aside className="product-sidebar">
        <div className="product-sidebar__brand">
          <BrandMark />
        </div>
        <WorkspaceSwitcher
          currentSlug={workspaceSlug}
          workspaces={workspaces}
        />
        <nav className="product-nav" aria-label="Navegação do Workspace">
          <Link href={`/w/${workspaceSlug}`}>
            <span aria-hidden="true">⌂</span>Início
          </Link>
          <Link href={`/w/${workspaceSlug}/members`}>
            <span aria-hidden="true">◎</span>Members
          </Link>
        </nav>
        <div className="product-sidebar__footer">
          <div>
            <strong>{session.user.name}</strong>
            <small>
              {current.role === "OWNER"
                ? "Owner"
                : current.role === "ADMIN"
                  ? "Admin"
                  : "Member"}
            </small>
          </div>
          <ThemeSwitcher />
          <SessionActions />
        </div>
      </aside>
      <header className="mobile-product-header">
        <WorkspaceSwitcher
          currentSlug={workspaceSlug}
          workspaces={workspaces}
        />
        <ThemeSwitcher />
      </header>
      <main className="product-main">
        <VerificationBanner user={session.user} />
        {children}
      </main>
      <nav className="mobile-bottom-nav" aria-label="Navegação do Workspace">
        <Link href={`/w/${workspaceSlug}`}>
          <span aria-hidden="true">⌂</span>Início
        </Link>
        <Link href={`/w/${workspaceSlug}/members`}>
          <span aria-hidden="true">◎</span>Members
        </Link>
        <details>
          <summary>
            <span aria-hidden="true">•••</span>Conta
          </summary>
          <div>
            <strong>{session.user.name}</strong>
            <SessionActions />
          </div>
        </details>
      </nav>
    </div>
  );
}
