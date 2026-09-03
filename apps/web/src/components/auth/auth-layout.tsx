"use client";

import type { PropsWithChildren } from "react";
import { useEffect } from "react";

import { BrandMark } from "@/components/brand-mark";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function AuthLayout({
  children,
  variant = "default",
}: PropsWithChildren<{ variant?: "default" | "verification" }>) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      className={`auth-experience${variant === "verification" ? " auth-experience--verification" : ""}`}
    >
      <header className="auth-header">
        <BrandMark />
        <span className="auth-header__theme">
          <ThemeSwitcher />
        </span>
      </header>
      <main
        className={`auth-experience__main${variant === "verification" ? " auth-experience__main--verification" : ""}`}
      >
        {variant === "default" ? (
          <div className="auth-context">
            <p className="auth-context__headline">
              <span>Seu tempo, </span>
              <span>com contexto.</span>
            </p>
            <strong>Registrar. Reconstruir. Entender.</strong>
          </div>
        ) : null}
        {children}
      </main>
      <footer className="auth-footer">
        <span>Grátis durante o beta</span>
      </footer>
    </div>
  );
}
