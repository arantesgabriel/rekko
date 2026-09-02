import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectForm } from "@/components/projects/project-form";
import { WorkItemForm } from "@/components/projects/work-item-form";
import { WorkItemFilters } from "@/components/projects/work-item-filters";
import { StartTimerButton } from "@/components/time-tracking/timer-controls";
import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { requireCoreSession } from "@/modules/auth/session";
import { archiveProjectAction } from "@/modules/projects/actions";
import {
  formatEstimate,
  projectStatusLabel,
  workItemStatusLabel,
} from "@/modules/projects/domain";
import { ProjectError } from "@/modules/projects/errors";
import { getProjectPage } from "@/modules/projects/service";
import { getCurrentTimer } from "@/modules/time-tracking/service";

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
  const isLinear = data.project.source === "LINEAR";
  const activeTimer = await getCurrentTimer(session.user.id);
  const parents = data.parentOptions.map(({ id, title }) => ({ id, title }));
  const parentTitles = new Map(
    data.parentOptions.map((item) => [item.id, item.title]),
  );
  const itemCount = data.parentOptions.length;
  return (
    <PageContainer width="lg">
      <Link className="back-link" href={`/w/${workspaceSlug}/projects`}>
        ← Todos os projetos
      </Link>
      <PageHeader
        actions={
          <>
            {!data.project.archivedAt && data.project.status === "ACTIVE" && (
              <StartTimerButton
                slug={workspaceSlug}
                projectId={projectId}
                workItemId={null}
                hasActiveTimer={Boolean(activeTimer)}
                activeOnItem={
                  activeTimer?.projectId === projectId &&
                  !activeTimer.workItemId
                }
              />
            )}
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
                    <button
                      className="button button--destructive"
                      type="submit"
                    >
                      Arquivar projeto
                    </button>
                  </form>
                </div>
              </details>
            )}
          </>
        }
        description={
          <>
            {data.project.description ? `${data.project.description} · ` : null}
            Estimativa total · {formatEstimate(data.project.estimatedMinutes)}
          </>
        }
        eyebrow={
          <div className="page-header__badges">
            <span className="source-badge">
              {isLinear ? "Linear" : "Manual"}
            </span>
            <span
              className={`status-badge status-badge--${data.project.status.toLowerCase()}`}
            >
              {projectStatusLabel[data.project.status]}
            </span>
          </div>
        }
        title={data.project.name}
      />
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
        <SectionHeader
          actions={
            !data.project.archivedAt && isLinear ? (
              <Link
                className="button button--primary"
                href={`/w/${workspaceSlug}/work/new?source=linear&existingProjectId=${projectId}`}
              >
                Adicionar demandas do Linear
              </Link>
            ) : canManage ? (
              <details className="create-item">
                <summary className="button button--primary">
                  Criar demanda
                </summary>
                <div className="create-item__panel">
                  <h3 className="card-title">Nova demanda</h3>
                  <WorkItemForm
                    slug={workspaceSlug}
                    projectId={projectId}
                    parents={parents}
                  />
                </div>
              </details>
            ) : undefined
          }
          description={`${itemCount} ${itemCount === 1 ? "demanda" : "demandas"}`}
          id="work-items-title"
          title="Demandas"
        />
        <WorkItemFilters
          kind={typeof query.kind === "string" ? query.kind : "ALL"}
          query={typeof query.q === "string" ? query.q : ""}
          status={typeof query.status === "string" ? query.status : "ALL"}
        />
        {data.items.length === 0 ? (
          <EmptyState
            description={
              query.q || query.status || query.kind
                ? "Ajuste a busca ou os filtros para encontrar outras demandas."
                : "Crie a primeira demanda para começar a organizar o trabalho."
            }
            title="Nenhuma demanda neste projeto ainda."
          />
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
                  <strong className="card-title">{item.title}</strong>
                  {item.description && <p>{item.description}</p>}
                </div>
                <div className="work-item-row__meta">
                  <span
                    className={`status-badge status-badge--${item.status.toLowerCase()}`}
                  >
                    {workItemStatusLabel[item.status]}
                  </span>
                  <span className="work-item-estimate">
                    {formatEstimate(item.estimatedMinutes)}
                  </span>
                </div>
                <div className="work-item-row__actions">
                  {!data.project.archivedAt &&
                    item.status !== "DONE" &&
                    item.isTrackable && (
                      <StartTimerButton
                        slug={workspaceSlug}
                        projectId={projectId}
                        workItemId={item.id}
                        hasActiveTimer={Boolean(activeTimer)}
                        activeOnItem={activeTimer?.workItemId === item.id}
                      />
                    )}
                  {item.source === "LINEAR" && item.externalUrl ? (
                    <a
                      className="button button--ghost button--sm"
                      href={item.externalUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Abrir no Linear
                    </a>
                  ) : null}
                  {canManage && item.source === "MANUAL" && (
                    <details className="item-editor">
                      <summary
                        aria-label={`Mais ações para ${item.title}`}
                        className="button button--ghost button--icon button--sm"
                        title="Mais ações"
                      >
                        <span aria-hidden="true">•••</span>
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
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
