import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { parseServerEnv } from "@rekko/shared/env";
import { BrandMark } from "@/components/brand-mark";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { SessionActions } from "@/components/auth/session-actions";
import { auth } from "@/modules/auth/auth";
import {
  getGraceHoursRemaining,
  getVerificationAccess,
} from "@/modules/auth/grace-period";

export const metadata = { title: "Sua conta" };

export default async function AppPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login?next=/app");
  const env = parseServerEnv(process.env);
  const now = new Date();
  const access = getVerificationAccess({
    createdAt: session.user.createdAt,
    emailVerified: session.user.emailVerified,
    graceHours: env.EMAIL_VERIFICATION_GRACE_HOURS,
    now,
  });
  const hours = getGraceHoursRemaining({
    createdAt: session.user.createdAt,
    graceHours: env.EMAIL_VERIFICATION_GRACE_HOURS,
    now,
  });
  return (
    <div className="account-shell">
      <header className="account-header">
        <BrandMark />
        <ThemeSwitcher />
      </header>
      <main className="account-main">
        {access === "blocked" ? (
          <section className="verification-gate">
            <div
              className="segment-mark segment-mark--brand"
              aria-hidden="true"
            >
              <span />
              <span />
              <span />
            </div>
            <h1>Confirme seu email para continuar.</h1>
            <p>
              Seu acesso está seguro. Confirme{" "}
              <strong>{session.user.email}</strong> para entrar no core do
              Rekko.
            </p>
            <Link
              className="button button--primary"
              href={`/verify-email?email=${encodeURIComponent(session.user.email)}`}
            >
              Confirmar ou reenviar email
            </Link>
            <SessionActions />
          </section>
        ) : (
          <>
            {access === "allowed" && (
              <aside className="verification-banner">
                <div>
                  <strong>
                    Confirme seu email nos próximos{" "}
                    {hours <= 24
                      ? `${hours} horas`
                      : `${Math.ceil(hours / 24)} dias`}
                    .
                  </strong>
                  <span>
                    Assim você continua usando o Rekko sem interrupções.
                  </span>
                </div>
                <Link
                  href={`/verify-email?email=${encodeURIComponent(session.user.email)}`}
                >
                  Reenviar confirmação
                </Link>
              </aside>
            )}
            <section className="account-ready">
              <span className="account-ready__status">Conta pronta</span>
              <h1>Olá, {session.user.name}.</h1>
              <p>
                Sua autenticação está funcionando. A configuração do Workspace
                será adicionada na próxima etapa.
              </p>
              <div className="account-ready__next">
                <span>Próxima etapa</span>
                <strong>Criar seu Workspace</strong>
                <small>Disponível somente na Fase 2</small>
              </div>
              <SessionActions />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
