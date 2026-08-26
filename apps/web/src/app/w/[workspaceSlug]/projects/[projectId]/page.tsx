import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectForm } from "@/components/projects/project-form";
import { WorkItemForm } from "@/components/projects/work-item-form";
import { requireCoreSession } from "@/modules/auth/session";
import { archiveProjectAction } from "@/modules/projects/actions";
import {
  formatEstimate,
  projectStatusLabel,
  workItemStatusLabel,
} from "@/modules/projects/domain";
import { ProjectError } from "@/modules/projects/errors";
import { getProjectPage } from "@/modules/projects/service";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workspaceSlug, projectId } = await params;
  const query = await searchParams;
  const session = await requireCoreSession(
    `/w/${workspaceSlug}/projects/${projectId}`,
  );
  let data;
  try {
    const search = typeof query.q === "string" ? query.q : undefined;
    data = await getProjectPage({
      userId: session.user.id,
      slug: workspaceSlug,
      projectId,
      ...(search ? { search } : {}),
      status:
        query.status === "TODO" ||
        query.status === "IN_PROGRESS" ||
        query.status === "DONE"
          ? query.status
          : "ALL",
      kind:
        query.kind === "ROOT" || query.kind === "SUB_ITEM" ? query.kind : "ALL",
    });
  } catch (error) {
    if (error instanceof ProjectError && error.code === "PROJECT_NOT_FOUND")
      notFound();
    throw error;
  }
  const canManage = data.context.role !== "MEMBER" && !data.project.archivedAt;
  const parents = data.parentOptions.map(({ id, title }) => ({ id, title }));
  const parentTitles = new Map(
    data.parentOptions.map((item) => [item.id, item.title]),
  );
  return (
    <div className="product-page">
      <Link className="back-link" href={`/w/${workspaceSlug}/work`}>
        ← Todos os projetos
      </Link>
      <header className="project-header">
        <div>
          <div className="project-header__badges">
            <span className="source-badge">Manual</span>
            <span
              className={`status-badge status-badge--${data.project.status.toLowerCase()}`}
            >
              {projectStatusLabel[data.project.status]}
            </span>
          </div>
          <h1>{data.project.name}</h1>
          {data.project.description && <p>{data.project.description}</p>}
          <span className="project-estimate">
            Estimativa total · {formatEstimate(data.project.estimatedMinutes)}
          </span>
        </div>
        {canManage && (
          <details className="project-settings">
            <summary className="button button--secondary">
              Editar projeto
            </summary>
            <div className="project-settings__panel">
              <ProjectForm slug={workspaceSlug} project={data.project} />
              <form
                action={archiveProjectAction.bind(
                  null,
                  workspaceSlug,
                  projectId,
                )}
              >
                <button className="danger-text-button" type="submit">
                  Arquivar projeto
                </button>
              </form>
            </div>
          </details>
        )}
      </header>
      {query.created === "1" && (
        <p className="form-message form-message--success" role="status">
          Projeto criado.
        </p>
      )}
      {query.error === "archive" && (
        <p className="form-message form-message--error" role="alert">
          Não foi possível arquivar este projeto.
        </p>
      )}
      <section
        className="work-items-section"
        aria-labelledby="work-items-title"
      >
        <div className="section-heading">
          <div>
            <h2 id="work-items-title">Demandas</h2>
            <span>{data.parentOptions.length} no projeto</span>
          </div>
          {canManage && (
            <details className="create-item">
              <summary className="button button--primary">
                Criar demanda
              </summary>
              <div className="create-item__panel">
                <h3>Nova demanda</h3>
                <WorkItemForm
                  slug={workspaceSlug}
                  projectId={projectId}
                  parents={parents}
                />
              </div>
            </details>
          )}
        </div>
        <form className="work-filters" method="get">
          <label>
            <span className="sr-only">Buscar demandas</span>
            <input
              defaultValue={typeof query.q === "string" ? query.q : ""}
              name="q"
              placeholder="Buscar por título…"
              type="search"
            />
          </label>
          <label>
            <span className="sr-only">Filtrar por status</span>
            <select
              defaultValue={
                typeof query.status === "string" ? query.status : "ALL"
              }
              name="status"
            >
              <option value="ALL">Todos os status</option>
              <option value="TODO">A fazer</option>
              <option value="IN_PROGRESS">Em andamento</option>
              <option value="DONE">Concluídas</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Filtrar por hierarquia</span>
            <select
              defaultValue={typeof query.kind === "string" ? query.kind : "ALL"}
              name="kind"
            >
              <option value="ALL">Toda hierarquia</option>
              <option value="ROOT">Itens principais</option>
              <option value="SUB_ITEM">Sub-itens</option>
            </select>
          </label>
          <button className="button button--secondary" type="submit">
            Aplicar
          </button>
        </form>
        {data.items.length === 0 ? (
          <div className="items-empty">
            <h3>Nenhuma demanda neste projeto ainda.</h3>
            <p>
              {query.q || query.status || query.kind
                ? "Ajuste a busca ou os filtros para encontrar outras demandas."
                : "Crie a primeira demanda para começar a organizar o trabalho."}
            </p>
          </div>
        ) : (
          <div className="work-item-list">
            {data.items.map((item) => (
              <article
                className={`work-item-row ${item.parentWorkItemId ? "is-child" : ""}`}
                key={item.id}
              >
                <div className="work-item-row__main">
                  {item.parentWorkItemId && (
                    <small>
                      {parentTitles.get(item.parentWorkItemId) ?? "Sub-item"}
                    </small>
                  )}
                  <strong>{item.title}</strong>
                  {item.description && <p>{item.description}</p>}
                </div>
                <span
                  className={`status-badge status-badge--${item.status.toLowerCase()}`}
                >
                  {workItemStatusLabel[item.status]}
                </span>
                <span className="work-item-estimate">
                  {formatEstimate(item.estimatedMinutes)}
                </span>
                {canManage && (
                  <details className="item-editor">
                    <summary aria-label={`Editar ${item.title}`}>
                      Editar
                    </summary>
                    <div>
                      <WorkItemForm
                        slug={workspaceSlug}
                        projectId={projectId}
                        item={item}
                        parents={parents}
                      />
                    </div>
                  </details>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
