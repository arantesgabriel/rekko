import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { requireCoreSession } from "@/modules/auth/session";
import { formatEstimate, projectStatusLabel } from "@/modules/projects/domain";
import { listProjects } from "@/modules/projects/service";

export const metadata = { title: "Projetos" };

export default async function WorkPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workspaceSlug } = await params;
  const query = await searchParams;
  const session = await requireCoreSession(`/w/${workspaceSlug}/work`);
  const { context, projects } = await listProjects(
    session.user.id,
    workspaceSlug,
  );
  const canManage = context.role !== "MEMBER";
  return (
    <PageContainer width="lg">
      <PageHeader
        actions={
          canManage ? (
            <Link
              className="button button--primary"
              href={`/w/${workspaceSlug}/work/new`}
            >
              Criar projeto
            </Link>
          ) : undefined
        }
        description="Projetos e demandas que dão contexto ao trabalho do Workspace."
        eyebrow={context.name}
        title="Projetos"
      />
      {query.archived === "1" && (
        <p className="form-message form-message--success" role="status">
          Projeto arquivado.
        </p>
      )}
      {projects.length === 0 ? (
        <EmptyState
          actions={
            canManage ? (
              <Link
                className="button button--primary"
                href={`/w/${workspaceSlug}/work/new`}
              >
                Criar projeto
              </Link>
            ) : (
              <small>
                Proprietário ou administrador pode criar o primeiro projeto.
              </small>
            )
          }
          description="Organize seu trabalho criando um projeto manualmente."
          title="Nenhum projeto ainda."
        />
      ) : (
        <section className="project-grid" aria-label="Projetos ativos">
          {projects.map((item) => (
            <Link
              className="project-card"
              href={`/w/${workspaceSlug}/projects/${item.id}`}
              key={item.id}
            >
              <div className="project-card__top">
                <span className="source-badge">Manual</span>
                <span
                  className={`status-badge status-badge--${item.status.toLowerCase()}`}
                >
                  {projectStatusLabel[item.status]}
                </span>
              </div>
              <div>
                <h2 className="card-title">{item.name}</h2>
                {item.description && <p>{item.description}</p>}
              </div>
              <dl>
                <div>
                  <dt>Estimativa</dt>
                  <dd>{formatEstimate(item.estimatedMinutes)}</dd>
                </div>
                <div>
                  <dt>Demandas</dt>
                  <dd>{item.workItemCount}</dd>
                </div>
              </dl>
            </Link>
          ))}
        </section>
      )}
    </PageContainer>
  );
}
