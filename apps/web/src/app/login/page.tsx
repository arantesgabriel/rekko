import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { ThemeSwitcher } from "@/components/theme-switcher";

export const metadata = { title: "Entrar" };

export default function AuthShellPage() {
  return (
    <div className="auth-shell">
      <header className="auth-header">
        <BrandMark />
        <ThemeSwitcher />
      </header>
      <main className="auth-main">
        <section className="auth-panel" aria-labelledby="auth-title">
          <div className="segment-mark segment-mark--brand" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h1 id="auth-title">Boas-vindas ao Rekko</h1>
          <p>
            A fundação está pronta. Cadastro e acesso seguro chegam na próxima
            fase do produto.
          </p>
          <Link className="button button--primary button--full" href="/">
            Voltar ao início
          </Link>
        </section>
      </main>
    </div>
  );
}
