import Link from "next/link";

import { requireCoreSession } from "@/modules/auth/session";
import { formatEstimate, projectStatusLabel } from "@/modules/projects/domain";
import { listProjects } from "@/modules/projects/service";

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
    <div className="product-page">
      <header className="page-header">
        <div>
          <p className="page-context">{context.name}</p>
          <h1>Work</h1>
          <p>Projetos e demandas que dão contexto ao trabalho do Workspace.</p>
        </div>
        {canManage && (
          <Link
            className="button button--primary"
            href={`/w/${workspaceSlug}/work/new`}
          >
            Criar projeto
          </Link>
        )}
      </header>
      {query.archived === "1" && (
        <p className="form-message form-message--success" role="status">
          Projeto arquivado.
        </p>
      )}
      {projects.length === 0 ? (
        <section className="work-empty">
          <div className="segment-mark segment-mark--brand" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h2>Nenhum projeto ainda.</h2>
          <p>Organize seu trabalho criando um projeto manualmente.</p>
          {canManage ? (
            <Link
              className="button button--primary"
              href={`/w/${workspaceSlug}/work/new`}
            >
              Criar projeto
            </Link>
          ) : (
            <small>Owner ou Admin pode criar o primeiro projeto.</small>
          )}
        </section>
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
                <h2>{item.name}</h2>
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
    </div>
  );
}
