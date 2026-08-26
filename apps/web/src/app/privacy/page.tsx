import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

export const metadata = { title: "Política de Privacidade" };

export default function PrivacyPage() {
  return (
    <div className="account-shell">
      <header className="account-header">
        <BrandMark />
        <Link href="/signup">Voltar ao cadastro</Link>
      </header>
      <main className="account-main">
        <h1>Política de Privacidade</h1>
        <p>
          Tratamos apenas os dados necessários para autenticação, participação
          no Workspace e reconstrução da jornada de trabalho.
        </p>
        <p>
          Não vendemos dados pessoais. Tokens de integrações e segredos nunca
          devem ser expostos no navegador. Durante o beta, esta política será
          detalhada antes da abertura pública.
        </p>
      </main>
    </div>
  );
}
