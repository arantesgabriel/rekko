"use client";

import { SessionActions } from "@/components/auth/session-actions";

export function OnboardingAccountMenu({ name }: { name: string }) {
  return (
    <details className="onboarding-account-menu">
      <summary aria-label="Abrir opções da conta">
        <span aria-hidden="true">{name.trim().charAt(0).toUpperCase()}</span>
        <span className="onboarding-account-menu__label">Conta</span>
        <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
          <path d="m4 6 4 4 4-4" stroke="currentColor" strokeLinecap="round" />
        </svg>
      </summary>
      <div className="onboarding-account-menu__popover">
        <p>
          <strong>{name}</strong>
          <span>Opções da sessão</span>
        </p>
        <SessionActions />
      </div>
    </details>
  );
}
