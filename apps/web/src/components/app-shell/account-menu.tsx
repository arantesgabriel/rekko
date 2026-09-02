"use client";

import { SessionActions } from "@/components/auth/session-actions";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";

export function AppAccountMenu({
  compact = false,
  name,
  roleLabel,
  workspaceSlug,
}: {
  compact?: boolean;
  name: string;
  roleLabel: string;
  workspaceSlug: string;
}) {
  return (
    <details className="app-account-menu">
      <summary aria-label="Conta" title={compact ? name : undefined}>
        <span className="member-avatar" aria-hidden="true">
          {name.trim().charAt(0).toUpperCase()}
        </span>
        <span className="app-account-menu__copy">
          <strong>{name}</strong>
          <small>{roleLabel}</small>
        </span>
      </summary>
      <div className="app-account-menu__popover">
        <p>
          <strong>{name}</strong>
          <span>{roleLabel}</span>
        </p>
        <div className="app-account-menu__theme">
          <span>Tema</span>
          <ThemeSwitcher />
        </div>
        <Link
          className="app-account-menu__settings"
          href={`/w/${workspaceSlug}/settings`}
        >
          Configurações
        </Link>
        <SessionActions />
      </div>
    </details>
  );
}
