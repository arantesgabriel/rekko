import Link from "next/link";

import { DemandFilters } from "@/components/demands/demand-filters";
import { EmptyState } from "@/components/ui/empty-state";
import type {
  DemandListItem,
  DemandProjectOption,
} from "@/modules/projects/service";

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return [hours ? `${hours}h` : "", minutes || !hours ? `${minutes}m` : ""]
    .filter(Boolean)
    .join(" ");
}

function formatActivity(
  date: Date | null,
  timezone: string,
  isRunning: boolean,
) {
  if (isRunning) return "Agora";
  if (!date) return "Sem registros";
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const time = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  if (today === day) return `Hoje, ${time}`;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    day: "2-digit",
    month: "short",
  })
    .format(date)
    .replace(" de ", " ");
}

function statusLabel(item: DemandListItem) {
  if (item.status === "DONE") return "Concluída";
  return "Ativa";
}

export function DemandsView({
  demands,
  projectOptions,
  query,
  slug,
  timezone,
}: {
  demands: DemandListItem[];
  projectOptions: DemandProjectOption[];
  query: {
    projectId: string;
    search: string;
    status: "ALL" | "ACTIVE" | "DONE";
  };
  slug: string;
  timezone: string;
}) {
  const hasFilters = Boolean(
    query.search || query.projectId || query.status !== "ALL",
  );
  return (
    <div className="demands-page">
      <header className="demands-header">
        <div>
          <p className="demands-header__eyebrow">Trabalho do Workspace</p>
          <h1 className="page-title">Demandas</h1>
          <p className="page-description">
            Organize e acompanhe os itens nos quais seu tempo é registrado.
          </p>
        </div>
        <div className="demands-header__actions">
          <Link
            className="button button--secondary demands-projects-link"
            href={`/w/${slug}/projects`}
          >
            Projetos
          </Link>
          <Link
            className="button button--primary"
            href={`/w/${slug}/work/new?mode=demand`}
          >
            <span aria-hidden="true">+</span> Nova demanda
          </Link>
        </div>
      </header>

      <section className="demands-toolbar" aria-label="Busca e filtros">
        <DemandFilters
          initialProjectId={query.projectId}
          initialQuery={query.search}
          initialStatus={query.status}
          projects={projectOptions}
          key={`${query.search}:${query.status}:${query.projectId}`}
        />
        <Link
          className="demands-toolbar__project-link"
          href={`/w/${slug}/work/new`}
        >
          Criar projeto
        </Link>
      </section>

      {demands.length === 0 ? (
        <EmptyState
          actions={
            hasFilters ? (
              <p className="demands-empty__hint">
                Limpe os filtros para ver todas as demandas.
              </p>
            ) : (
              <>
                <Link
                  className="button button--primary"
                  href={`/w/${slug}/work/new?mode=demand`}
                >
                  + Criar demanda
                </Link>
                {projectOptions.length ? (
                  <div className="demands-empty__projects">
                    <span>Ou comece por um projeto:</span>
                    {projectOptions.map((project) => (
                      <Link
                        href={`/w/${slug}/projects/${project.id}`}
                        key={project.id}
                      >
                        {project.name}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </>
            )
          }
          description={
            hasFilters
              ? "Não encontramos uma demanda com esses filtros."
              : "Crie uma demanda para começar a organizar onde seu tempo está sendo utilizado."
          }
          title={
            hasFilters ? "Nenhuma demanda encontrada" : "Nenhuma demanda ainda"
          }
        />
      ) : (
        <section className="demands-list" aria-labelledby="demands-list-title">
          <div className="demands-list__heading">
            <h2 id="demands-list-title">
              {demands.length} {demands.length === 1 ? "demanda" : "demandas"}
            </h2>
            <span>Tempo registrado por você</span>
          </div>
          <div className="demands-table-head" aria-hidden="true">
            <span>Demanda</span>
            <span>Contexto</span>
            <span>Status</span>
            <span>Tempo</span>
            <span>Última atividade</span>
            <span />
          </div>
          <div className="demands-list__rows">
            {demands.map((demand) => (
              <DemandRow
                demand={demand}
                key={demand.id}
                slug={slug}
                timezone={timezone}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function DemandRow({
  demand,
  slug,
  timezone,
}: {
  demand: DemandListItem;
  slug: string;
  timezone: string;
}) {
  const projectHref = `/w/${slug}/projects/${demand.projectId}`;
  const title = demand.externalIdentifier
    ? `${demand.externalIdentifier} · ${demand.title}`
    : demand.title;
  return (
    <article className="demand-row">
      <div className="demand-row__main">
        <Link className="demand-row__title" href={projectHref}>
          {demand.externalIdentifier ? (
            <span className="demand-row__identifier">
              {demand.externalIdentifier}
            </span>
          ) : null}
          <strong>{demand.title}</strong>
        </Link>
        {demand.parentWorkItemId ? (
          <span className="demand-row__parent">
            Sub-item de uma demanda principal
          </span>
        ) : demand.description ? (
          <span className="demand-row__description">{demand.description}</span>
        ) : null}
      </div>
      <div className="demand-row__context">
        <Link href={projectHref}>{demand.projectName}</Link>
        <span>{demand.source === "LINEAR" ? "Linear" : "Manual"}</span>
      </div>
      <div
        className={`demand-status demand-status--${demand.status.toLowerCase()}`}
      >
        <span aria-hidden="true" />
        {statusLabel(demand)}
      </div>
      <div className="demand-row__time">
        <strong>{formatDuration(demand.trackedSeconds)}</strong>
        <span>
          {demand.recordCount === 1
            ? "1 registro"
            : `${demand.recordCount} registros`}
        </span>
      </div>
      <div
        className={`demand-row__activity${demand.isRunning ? " is-running" : ""}`}
      >
        {formatActivity(demand.lastActivityAt, timezone, demand.isRunning)}
      </div>
      <details className="demand-row__menu">
        <summary
          aria-label={`Mais ações para ${title}`}
          className="button button--ghost button--icon button--sm"
        >
          <span aria-hidden="true">•••</span>
        </summary>
        <div className="demand-row__menu-panel">
          <Link href={projectHref}>Abrir demanda</Link>
          <Link href={`${projectHref}#work-items-title`}>
            Editar no projeto
          </Link>
          {demand.externalUrl ? (
            <a href={demand.externalUrl} rel="noreferrer" target="_blank">
              Abrir no Linear
            </a>
          ) : null}
        </div>
      </details>
    </article>
  );
}
