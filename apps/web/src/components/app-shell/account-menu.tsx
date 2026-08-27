"use client";

import { SessionActions } from "@/components/auth/session-actions";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function AppAccountMenu({
  compact = false,
  name,
  roleLabel,
}: {
  compact?: boolean;
  name: string;
  roleLabel: string;
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
        <SessionActions />
      </div>
    </details>
  );
}
