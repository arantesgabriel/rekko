import { headers } from "next/headers";
import Link from "next/link";

import { AcceptInvitation } from "@/components/workspaces/accept-invitation";
import { BrandMark } from "@/components/brand-mark";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { auth } from "@/modules/auth/auth";
import {
  WorkspaceError,
  workspaceErrorMessage,
} from "@/modules/workspaces/errors";
import { getInvitation } from "@/modules/workspaces/service";

export const metadata = { title: "Convite para Workspace" };

export default async function InvitationPage({
  params,
}: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  let invitation: Awaited<ReturnType<typeof getInvitation>> | null = null;
  let error = "";
  try {
    invitation = await getInvitation(token);
  } catch (cause) {
    error =
      cause instanceof WorkspaceError
        ? workspaceErrorMessage[cause.code]
        : "Não conseguimos abrir este convite.";
  }
  const next = `/invite/${token}`;
  return (
    <main className="onboarding-shell">
      <header className="onboarding-header">
        <BrandMark />
        <ThemeSwitcher />
      </header>
      <section className="invitation-card">
        {!invitation ? (
          <>
            <h1>Este convite não está disponível.</h1>
            <p>{error}</p>
            <Link className="button button--secondary" href="/app">
              Voltar ao Rekko
            </Link>
          </>
        ) : (
          <>
            <p className="onboarding-step">Convite para Workspace</p>
            <h1>Entre em {invitation.workspaceName}.</h1>
            <p>
              Este convite foi enviado para <strong>{invitation.email}</strong>.
            </p>
            {invitation.status !== "PENDING" ? (
              <p className="form-message form-message--error">
                {invitation.status === "EXPIRED"
                  ? "Este convite expirou. Peça um novo envio."
                  : invitation.status === "CANCELLED"
                    ? "Este convite foi cancelado."
                    : "Este convite já foi aceito."}
              </p>
            ) : session ? (
              <>
                <p>
                  Você está entrando como <strong>{session.user.email}</strong>.
                </p>
                <AcceptInvitation token={token} />
              </>
            ) : (
              <div className="invitation-auth-actions">
                <Link
                  className="button button--primary"
                  href={`/signup?next=${encodeURIComponent(next)}`}
                >
                  Criar conta e aceitar
                </Link>
                <Link
                  className="button button--secondary"
                  href={`/login?next=${encodeURIComponent(next)}`}
                >
                  Entrar para aceitar
                </Link>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
