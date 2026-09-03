import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { requireCoreSession } from "@/modules/auth/session";
import {
  connectLinearE2EAction,
  disconnectLinearAction,
  syncLinearAction,
} from "@/modules/integrations/linear/actions";
import { getLinearConnection } from "@/modules/integrations/linear/service";

export const metadata = { title: "Integrações" };

export default async function IntegrationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workspaceSlug } = await params;
  const query = await searchParams;
  const session = await requireCoreSession(`/w/${workspaceSlug}/integrations`);
  const { connection, role } = await getLinearConnection({
    slug: workspaceSlug,
    userId: session.user.id,
  });
  const canManage = role !== "MEMBER";
  const message = linearMessage(query.linear);
  return (
    <PageContainer width="lg">
      <PageHeader
        description="Conecte o contexto do seu trabalho sem importar tudo automaticamente."
        title="Integrações"
      />
      {message ? (
        <p
          className={`form-message form-message--${message.kind}`}
          role="status"
        >
          {message.text}
        </p>
      ) : null}
      <section className="integration-card" aria-labelledby="linear-title">
        <div className="integration-card__heading">
          <span className="integration-card__icon" aria-hidden="true">
            <LinearIcon />
          </span>
          <div>
            <h2 className="card-title" id="linear-title">
              Linear
            </h2>
            <p>Conecte seu trabalho ao Rekko.</p>
          </div>
          <span
            className={`status-badge status-badge--${connection?.status === "CONNECTED" ? "active" : "completed"}`}
          >
            {connection?.status === "CONNECTED"
              ? "Conectado"
              : connection?.status === "RECONNECT_REQUIRED"
                ? "Reconexão necessária"
                : "Não conectado"}
          </span>
        </div>
        {connection ? (
          <dl className="integration-card__details">
            <div>
              <dt>Workspace</dt>
              <dd>{connection.externalWorkspaceName}</dd>
            </div>
            <div>
              <dt>Última sincronização</dt>
              <dd>
                {connection.lastSyncedAt
                  ? connection.lastSyncedAt.toLocaleString("pt-BR")
                  : "Ainda não sincronizado"}
              </dd>
            </div>
          </dl>
        ) : (
          <p>
            Owner ou Admin conecta uma vez. Todos podem usar os itens
            selecionados.
          </p>
        )}
        <div className="integration-card__actions">
          {canManage &&
          (!connection || connection.status === "RECONNECT_REQUIRED") ? (
            process.env.REKKO_E2E === "true" ? (
              <form action={connectLinearE2EAction.bind(null, workspaceSlug)}>
                <button className="button button--primary" type="submit">
                  {connection ? "Reconectar Linear" : "Conectar Linear"}
                </button>
              </form>
            ) : (
              <a
                className="button button--primary"
                href={`/api/integrations/linear/connect?workspace=${encodeURIComponent(workspaceSlug)}`}
              >
                {connection ? "Reconectar Linear" : "Conectar Linear"}
              </a>
            )
          ) : null}
          {canManage && connection?.status === "CONNECTED" ? (
            <>
              <form action={syncLinearAction.bind(null, workspaceSlug)}>
                <button className="button button--secondary" type="submit">
                  Sincronizar agora
                </button>
              </form>
              <form action={disconnectLinearAction.bind(null, workspaceSlug)}>
                <button className="button button--destructive" type="submit">
                  Desconectar
                </button>
              </form>
            </>
          ) : null}
          {!canManage && !connection ? (
            <small>
              Peça a um proprietário ou administrador para conectar o Linear.
            </small>
          ) : null}
        </div>
      </section>
    </PageContainer>
  );
}

function linearMessage(value: string | string[] | undefined) {
  if (value === "connected")
    return { kind: "success", text: "Linear conectado." };
  if (value === "disconnected")
    return {
      kind: "success",
      text: "Linear desconectado. Os itens e o histórico continuam disponíveis.",
    };
  if (value === "synced")
    return { kind: "success", text: "Sincronização concluída." };
  if (value === "not-configured")
    return {
      kind: "error",
      text: "A integração Linear ainda não está configurada neste ambiente.",
    };
  if (value === "failed")
    return {
      kind: "error",
      text: "Não conseguimos conectar o Linear agora. Tente novamente.",
    };
  return null;
}

function LinearIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24">
      <path
        d="M5.1 3.8a9.7 9.7 0 0 0-1.3 1.5l8.9 8.9 1.6-1.6-9.2-8.8Z"
        fill="currentColor"
      />
      <path
        d="M3.4 7.2a10.1 10.1 0 0 0-.8 2.2l7.4 7.4 1.6-1.6-8.2-8Z"
        fill="currentColor"
      />
      <path
        d="M3 12.2c.1 1.2.5 2.3 1 3.3l5.1 5.1a10 10 0 0 0 3.3.9L3 12.2Z"
        fill="currentColor"
      />
      <path
        d="M5.3 18.2a10.2 10.2 0 0 0 4 2.4l9.4-9.4-1.6-1.6-11.8 8.6Z"
        fill="currentColor"
      />
      <path
        d="M19.7 6.1a10.2 10.2 0 0 0-2.5-2.4L7.7 13.2l1.6 1.6 10.4-8.7Z"
        fill="currentColor"
      />
      <path
        d="M20.7 8.7a10 10 0 0 0-.8-2l-9.5 9.5 1.6 1.6 8.7-9.1Z"
        fill="currentColor"
      />
    </svg>
  );
}
