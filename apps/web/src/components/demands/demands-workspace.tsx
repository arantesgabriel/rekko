"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { DemandActionsMenu } from "@/components/demands/demand-actions-menu";
import { CreateDemandButton } from "@/components/demands/create-demand-button";
import { DemandDrawer } from "@/components/demands/demand-drawer";
import { DemandFilters } from "@/components/demands/demand-filters";
import { StartTimerButton } from "@/components/time-tracking/timer-controls";
import { ActionToast } from "@/components/ui/action-toast";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageToolbar } from "@/components/ui/page-toolbar";
import type {
  DemandListItem,
  DemandParentOption,
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
  if (!date) return "—";
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

export function DemandsWorkspace({
  activeTimerWorkItemId,
  canManage,
  demands,
  hasActiveTimer,
  parentOptions,
  projectOptions,
  query,
  slug,
  timezone,
}: {
  activeTimerWorkItemId: string | null;
  canManage: boolean;
  demands: DemandListItem[];
  hasActiveTimer: boolean;
  parentOptions: DemandParentOption[];
  projectOptions: DemandProjectOption[];
  query: {
    projectId: string;
    search: string;
    status: "ALL" | "ACTIVE" | "DONE";
  };
  slug: string;
  timezone: string;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editDemandId, setEditDemandId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const selected = demands.find((demand) => demand.id === selectedId);
  const selectedParents = selected
    ? parentOptions.filter((parent) => parent.projectId === selected.projectId)
    : [];
  const createParents = query.projectId
    ? parentOptions.filter((parent) => parent.projectId === query.projectId)
    : [];
  const hasFilters = Boolean(
    query.search || query.projectId || query.status !== "ALL",
  );

  const closeDrawer = useCallback(() => {
    setSelectedId(null);
    setEditDemandId(null);
    setCreateOpen(false);
  }, []);
  const refresh = useCallback(() => router.refresh(), [router]);
  const dismissFeedback = useCallback(() => setFeedback(""), []);
  const showFeedback = useCallback(
    (message: string) => setFeedback(message),
    [],
  );
  const openDemand = useCallback((id: string, edit = false) => {
    setCreateOpen(false);
    setEditDemandId(edit ? id : null);
    setSelectedId(id);
  }, []);

  return (
    <div className="demands-page">
      <PageHeader
        actions={
          <>
            <Link
              className="button button--tertiary demands-projects-link"
              href={`/w/${slug}/projects`}
            >
              <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
                <path
                  d="M2.75 5.75h5l1.5 1.75h8v8.75a1 1 0 0 1-1 1h-12.5a1 1 0 0 1-1-1z"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
                <path
                  d="M2.75 5.75v-1.25a1 1 0 0 1 1-1h3.5l1.5 1.75"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
              Projetos
            </Link>
            {canManage ? (
              <CreateDemandButton
                onClick={() => {
                  setSelectedId(null);
                  setEditDemandId(null);
                  setCreateOpen(true);
                }}
              />
            ) : null}
          </>
        }
        description="Organize e acompanhe os itens nos quais seu tempo é registrado."
        title="Demandas"
      />

      <PageToolbar label="Busca e filtros" surface>
        <DemandFilters
          initialProjectId={query.projectId}
          initialQuery={query.search}
          initialStatus={query.status}
          key={`${query.search}:${query.status}:${query.projectId}`}
          projects={projectOptions}
        />
      </PageToolbar>

      {demands.length === 0 ? (
        <EmptyState
          actions={
            hasFilters ? (
              <p className="demands-empty__hint">
                Limpe os filtros para ver todas as demandas.
              </p>
            ) : canManage ? (
              <>
                <button
                  className="button button--primary"
                  onClick={() => setCreateOpen(true)}
                  type="button"
                >
                  + Nova demanda
                </button>
                {projectOptions.length ? (
                  <div className="demands-empty__projects">
                    <span>Ou abra um projeto para começar:</span>
                    {projectOptions.slice(0, 3).map((project) => (
                      <Link
                        href={`/w/${slug}/projects/${project.id}`}
                        key={project.id}
                      >
                        {project.name}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    className="demands-empty__projects-link"
                    href={`/w/${slug}/projects`}
                  >
                    Nenhum projeto encontrado · Ir para Projetos
                  </Link>
                )}
              </>
            ) : null
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
            <span>Projeto</span>
            <span>Status</span>
            <span>Tempo</span>
            <span>Última atividade</span>
            <span>Ações</span>
          </div>
          <div className="demands-list__rows">
            {demands.map((demand) => {
              const title = demand.externalIdentifier
                ? `${demand.externalIdentifier} · ${demand.title}`
                : demand.title;
              return (
                <article className="demand-row" key={demand.id}>
                  <div className="demand-row__main">
                    <button
                      className="demand-row__title"
                      onClick={() => openDemand(demand.id)}
                      title={title}
                      type="button"
                    >
                      {demand.externalIdentifier ? (
                        <span className="demand-row__identifier">
                          {demand.externalIdentifier}
                        </span>
                      ) : null}
                      <strong>{demand.title}</strong>
                    </button>
                    {demand.parentWorkItemId ? (
                      <span className="demand-row__parent">
                        Sub-item de uma demanda principal
                      </span>
                    ) : demand.description ? (
                      <span className="demand-row__description">
                        {demand.description}
                      </span>
                    ) : null}
                  </div>
                  <div className="demand-row__context">
                    <Link href={`/w/${slug}/projects/${demand.projectId}`}>
                      {demand.projectName}
                    </Link>
                    <span>
                      {demand.source === "LINEAR" ? "Linear" : "Manual"}
                    </span>
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
                    {formatActivity(
                      demand.lastActivityAt,
                      timezone,
                      demand.isRunning,
                    )}
                  </div>
                  <div className="demand-row__actions">
                    {demand.projectStatus === "ACTIVE" &&
                    demand.isActive &&
                    demand.status !== "DONE" ? (
                      <StartTimerButton
                        activeOnItem={activeTimerWorkItemId === demand.id}
                        hasActiveTimer={hasActiveTimer}
                        projectId={demand.projectId}
                        slug={slug}
                        workItemId={demand.id}
                      />
                    ) : null}
                    <DemandActionsMenu
                      canManage={canManage}
                      demand={demand}
                      onChanged={refresh}
                      onEdit={() => openDemand(demand.id, true)}
                      onFeedback={showFeedback}
                      projects={projectOptions}
                      slug={slug}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {feedback ? (
        <ActionToast message={feedback} onDismiss={dismissFeedback} />
      ) : null}

      <DemandDrawer
        key={`demand-${selectedId ?? "none"}-${editDemandId ?? "view"}-${selected ? "open" : "closed"}`}
        canManage={canManage}
        onChanged={refresh}
        onClose={closeDrawer}
        onFeedback={showFeedback}
        open={Boolean(selected)}
        parents={selectedParents}
        projects={projectOptions}
        slug={slug}
        startInEdit={Boolean(selected && editDemandId === selected.id)}
        timezone={timezone}
        {...(selected ? { demand: selected } : {})}
      />
      <DemandDrawer
        key={`demand-create-${createOpen ? "open" : "closed"}`}
        canManage={canManage}
        {...(query.projectId ? { initialProjectId: query.projectId } : {})}
        onClose={closeDrawer}
        onFeedback={showFeedback}
        open={createOpen}
        parents={createParents}
        projects={projectOptions}
        slug={slug}
        timezone={timezone}
      />
    </div>
  );
}
