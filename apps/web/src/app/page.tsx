import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function LandingShellPage() {
  return (
    <div className="landing-shell">
      <header className="landing-header">
        <BrandMark inverted />
        <div className="landing-header__actions">
          <ThemeSwitcher />
          <Link className="button button--light" href="/login">
            Entrar
          </Link>
        </div>
      </header>

      <main className="landing-intro">
        <div className="segment-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <h1>Reconstrua seu tempo. Entenda sua jornada.</h1>
        <p>
          Uma base precisa para registrar o trabalho, recuperar o que ficou pelo
          caminho e compreender onde suas horas foram usadas.
        </p>
        <div className="landing-intro__actions">
          <Link className="button button--light" href="/login">
            Conhecer o Rekko
          </Link>
          <Link className="button button--quiet-light" href="/app">
            Ver app shell
          </Link>
        </div>
      </main>
    </div>
  );
}
