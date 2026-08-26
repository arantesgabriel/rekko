import type { PropsWithChildren } from "react";
import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="auth-experience">
      <header className="auth-header">
        <BrandMark />
        <ThemeSwitcher />
      </header>
      <main className="auth-experience__main">
        <div className="auth-context" aria-hidden="true">
          <div className="auth-context__segments">
            <span />
            <span />
            <span />
          </div>
          <p>Seu tempo, com contexto.</p>
          <strong>Track. Reconstruct. Understand.</strong>
        </div>
        {children}
      </main>
      <footer className="auth-footer">
        <Link href="/">Voltar para o início</Link>
        <span>Free during beta</span>
      </footer>
    </div>
  );
}
