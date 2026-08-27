import Link from "next/link";

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { requireCoreSession } from "@/modules/auth/session";
import {
  listWorkspacePeople,
  requireWorkspace,
} from "@/modules/workspaces/service";
import { listProjects } from "@/modules/projects/service";

export default async function WorkspaceHomePage({
  params,
  searchParams,
}: PageProps<"/w/[workspaceSlug]"> & {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workspaceSlug } = await params;
  const query = await searchParams;
  const session = await requireCoreSession(`/w/${workspaceSlug}`);
  const [current, people, work] = await Promise.all([
    requireWorkspace(session.user.id, workspaceSlug),
    listWorkspacePeople(session.user.id, workspaceSlug),
    listProjects(session.user.id, workspaceSlug),
  ]);
  const invited = people.invitations.some(
    (item) => item.status === "PENDING" || item.status === "ACCEPTED",
  );
  return (
    <PageContainer width="md">
      {query.convites === "envio-pendente" && (
        <p className="form-message form-message--warning" role="status">
          O workspace foi criado, mas um ou mais e-mails não foram enviados.
          Você pode reenviar os convites em Membros.
        </p>
      )}
      <PageHeader
        actions={
          <Link
            className="button button--secondary"
            href={`/w/${workspaceSlug}/members`}
          >
            Ver membros
          </Link>
        }
        description="Organize pessoas, projetos e demandas a partir deste espaço."
        eyebrow={current.name}
        title="Seu Workspace está pronto."
      />
      <div className="onboarding-overview">
        <section
          className="getting-started"
          aria-labelledby="getting-started-title"
        >
          <SectionHeader id="getting-started-title" title="Primeiros passos" />
          <ol>
            <li className="is-complete">
              <span aria-hidden="true">✓</span>
              <div>
                <strong>Criar Workspace</strong>
                <small>
                  {current.name} · {current.timezone}
                </small>
              </div>
            </li>
            <li className={invited ? "is-complete" : ""}>
              <span aria-hidden="true">{invited ? "✓" : "○"}</span>
              <div>
                <strong>Convidar seu time</strong>
                <small>
                  {invited
                    ? "Convite criado"
                    : "Opcional — você pode fazer isso depois"}
                </small>
              </div>
              {!invited && current.role !== "MEMBER" && (
                <Link href={`/w/${workspaceSlug}/members`}>Convidar</Link>
              )}
            </li>
            <li className={work.projects.length > 0 ? "is-complete" : ""}>
              <span aria-hidden="true">
                {work.projects.length > 0 ? "✓" : "○"}
              </span>
              <div>
                <strong>Criar seu primeiro projeto</strong>
                <small>
                  {work.projects.length > 0
                    ? `${work.projects.length} projeto${work.projects.length === 1 ? "" : "s"} criado${work.projects.length === 1 ? "" : "s"}`
                    : "Organize as primeiras demandas do Workspace"}
                </small>
              </div>
              {work.projects.length === 0 && current.role !== "MEMBER" && (
                <Link href={`/w/${workspaceSlug}/work/new`}>Criar projeto</Link>
              )}
            </li>
          </ol>
        </section>
        <aside className="phase-note">
          <div className="segment-mark segment-mark--brand" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h2 className="card-title">Seu trabalho, com contexto.</h2>
          <p>
            Use Projetos para organizar demandas. O registro de tempo acompanha
            o item em que você está trabalhando.
          </p>
        </aside>
      </div>
    </PageContainer>
  );
}
