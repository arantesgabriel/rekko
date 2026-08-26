import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

export const metadata = { title: "Termos de Uso" };

export default function TermsPage() {
  return (
    <div className="account-shell">
      <header className="account-header">
        <BrandMark />
        <Link href="/signup">Voltar ao cadastro</Link>
      </header>
      <main className="account-main">
        <h1>Termos de Uso</h1>
        <p>
          O Rekko está em beta. Ao criar uma conta, você concorda em usar o
          produto de forma responsável, respeitar os dados do seu Workspace e
          entender que funcionalidades ainda podem evoluir.
        </p>
        <p>
          Contas, convites e registros de tempo pertencem ao Workspace. Não use
          o Rekko para armazenar informações que você não tenha autorização de
          tratar.
        </p>
      </main>
    </div>
  );
}
