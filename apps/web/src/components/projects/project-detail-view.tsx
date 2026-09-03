"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { DemandActionsMenu } from "@/components/demands/demand-actions-menu";
import { CreateDemandButton } from "@/components/demands/create-demand-button";
import { DemandDrawer } from "@/components/demands/demand-drawer";
import { ProjectActionsMenu } from "@/components/projects/project-actions-menu";
import { ProjectDrawer } from "@/components/projects/project-drawer";
import { WorkItemFilters } from "@/components/projects/work-item-filters";
import { StartTimerButton } from "@/components/time-tracking/timer-controls";
import { ActionToast } from "@/components/ui/action-toast";
import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer } from "@/components/ui/page-container";
import { SectionHeader } from "@/components/ui/section-header";
import {
  formatEstimate,
  projectStatusLabel,
  workItemStatusLabel,
} from "@/modules/projects/domain";
import type {
  DemandListItem,
  ProjectListItem,
  ProjectSummary,
} from "@/modules/projects/service";

function formatDuration(seconds: number) {
  const minutes = Math.floor(Math.max(seconds, 0) / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return (
    [hours ? `${hours}h` : "", rest ? `${rest}m` : ""]
      .filter(Boolean)
      .join(" ") || "0m"
  );
}

function formatActivity(date: Date | null, timezone: string) {
  if (!date) return "Sem registros";
  const today = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).format(new Date());
  const value = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).format(date);
  if (today === value) return "Hoje";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: timezone,
  })
    .format(date)
    .replace(" de ", " ");
}

type ProjectDetail = Pick<
  ProjectListItem,
  "id" | "name" | "description" | "source" | "status" | "estimatedMinutes"
> & { archivedAt: Date | null };

export function ProjectDetailView({
  activeTimer,
  canManage,
  demands,
  filter,
  notice,
  parents,
  project,
  projectOptions,
  summary,
  slug,
  timezone,
}: {
  activeTimer: { workItemId: string | null } | null;
  canManage: boolean;
  demands: DemandListItem[];
  filter: { kind: string; query: string; status: string };
  notice?: string;
  parents: { id: string; title: string }[];
  project: ProjectDetail;
  projectOptions: { id: string; name: string }[];
  summary: ProjectSummary;
  slug: string;
  timezone: string;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editDemandId, setEditDemandId] = useState<string | null>(null);
  const [demandCreateOpen, setDemandCreateOpen] = useState(false);
  const [projectEditOpen, setProjectEditOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const selected = demands.find((demand) => demand.id === selectedId);
  const isLinear = project.source === "LINEAR";
  const isArchived = Boolean(project.archivedAt);

  const closeDemand = useCallback(() => {
    setSelectedId(null);
    setEditDemandId(null);
    setDemandCreateOpen(false);
  }, []);
  const refresh = useCallback(() => router.refresh(), [router]);
  const dismissFeedback = useCallback(() => setFeedback(""), []);
  const showFeedback = useCallback(
    (message: string) => setFeedback(message),
    [],
  );
  const openDemand = useCallback((id: string, edit = false) => {
    setDemandCreateOpen(false);
    setEditDemandId(edit ? id : null);
    setSelectedId(id);
  }, []);

  return (
    <PageContainer width="lg">
      <div className="project-detail-page">
        <Link className="back-link" href={`/w/${slug}/projects`}>
          ← Projetos
        </Link>
        <header className="project-detail-header">
          <div className="project-detail-header__copy">
            <div className="page-header__badges">
              <span className="source-badge">
                {isLinear ? "Linear" : "Manual"}
              </span>
              <span
                className={`status-badge status-badge--${project.status.toLowerCase()}`}
              >
                {projectStatusLabel[project.status]}
              </span>
            </div>
            <h1 className="page-title">{project.name}</h1>
            <p className="page-description">
              {project.description ||
                "Contexto para organizar demandas e reconstruir seu tempo."}
            </p>
          </div>
          <div className="project-detail-header__actions">
            {!isArchived && isLinear ? (
              <Link
                className="button button--secondary"
                href={`/w/${slug}/work/new?source=linear&existingProjectId=${project.id}`}
              >
                Adicionar demandas
              </Link>
            ) : !isArchived && canManage ? (
              <CreateDemandButton onClick={() => setDemandCreateOpen(true)} />
            ) : null}
            {canManage && !isArchived ? (
              <ProjectActionsMenu
                onChanged={() => router.push(`/w/${slug}/projects?archived=1`)}
                onEdit={() => setProjectEditOpen(true)}
                project={project}
                slug={slug}
              />
            ) : null}
          </div>
        </header>

        <section
          className="project-detail-summary"
          aria-label="Resumo do projeto"
        >
          <div className="project-detail-summary__primary">
            <span>Tempo registrado</span>
            <strong>{formatDuration(summary.trackedSeconds)}</strong>
          </div>
          <div className="project-detail-summary__meta">
            <span>
              {summary.demandCount}{" "}
              {summary.demandCount === 1 ? "demanda" : "demandas"}
            </span>
            <span>
              {summary.activeDemandCount}{" "}
              {summary.activeDemandCount === 1 ? "ativa" : "ativas"}
            </span>
            <span>
              Última atividade{" "}
              {formatActivity(summary.lastActivityAt, timezone)}
            </span>
            <span className="project-detail-summary__estimate">
              {project.estimatedMinutes
                ? `Estimativa · ${formatEstimate(project.estimatedMinutes)}`
                : "Sem estimativa"}
            </span>
          </div>
        </section>

        {notice ? (
          <p className="form-message form-message--success" role="status">
            {notice}
          </p>
        ) : null}

        <section
          className="project-demands-section"
          aria-labelledby="project-demands-title"
        >
          <SectionHeader
            description={`${demands.length} ${demands.length === 1 ? "demanda" : "demandas"} neste projeto`}
            id="project-demands-title"
            title="Demandas"
          />
          <WorkItemFilters
            compact
            kind={filter.kind}
            query={filter.query}
            status={filter.status}
          />
          {demands.length === 0 ? (
            <EmptyState
              actions={
                !isArchived && canManage ? (
                  <button
                    className="button button--primary"
                    onClick={() => setDemandCreateOpen(true)}
                    type="button"
                  >
                    + Criar demanda
                  </button>
                ) : undefined
              }
              description={
                filter.query || filter.status !== "ALL" || filter.kind !== "ALL"
                  ? "Ajuste a busca ou os filtros para encontrar outras demandas."
                  : "Crie uma demanda para começar a registrar trabalho dentro deste contexto."
              }
              title={
                filter.query || filter.status !== "ALL" || filter.kind !== "ALL"
                  ? "Nenhuma demanda encontrada"
                  : "Nenhuma demanda neste projeto"
              }
            />
          ) : (
            <div className="project-demand-list">
              {demands.map((demand) => (
                <article className="project-demand-row" key={demand.id}>
                  <button
                    className="project-demand-row__title"
                    onClick={() => openDemand(demand.id)}
                    title={demand.title}
                    type="button"
                  >
                    {demand.externalIdentifier ? (
                      <span>{demand.externalIdentifier}</span>
                    ) : null}
                    <strong>{demand.title}</strong>
                  </button>
                  <span
                    className={`demand-status demand-status--${demand.status.toLowerCase()}`}
                  >
                    <span aria-hidden="true" />
                    {workItemStatusLabel[demand.status]}
                  </span>
                  <div className="project-demand-row__time">
                    <div>
                      <span>Registrado</span>
                      <strong>{formatDuration(demand.trackedSeconds)}</strong>
                    </div>
                    {demand.estimatedMinutes ? (
                      <div>
                        <span>Estimativa</span>
                        <small>{formatEstimate(demand.estimatedMinutes)}</small>
                      </div>
                    ) : null}
                  </div>
                  <div className="project-demand-row__actions">
                    {!isArchived &&
                    demand.status !== "DONE" &&
                    demand.isActive ? (
                      <StartTimerButton
                        activeOnItem={activeTimer?.workItemId === demand.id}
                        hasActiveTimer={Boolean(activeTimer)}
                        projectId={project.id}
                        slug={slug}
                        workItemId={demand.id}
                      />
                    ) : null}
                    {demand.source === "LINEAR" && demand.externalUrl ? (
                      <a
                        className="button button--ghost button--sm"
                        href={demand.externalUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Linear
                      </a>
                    ) : null}
                    <DemandActionsMenu
                      canManage={canManage && !isArchived}
                      demand={demand}
                      onChanged={refresh}
                      onEdit={() => openDemand(demand.id, true)}
                      onFeedback={showFeedback}
                      projects={projectOptions}
                      slug={slug}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      {feedback ? (
        <ActionToast message={feedback} onDismiss={dismissFeedback} />
      ) : null}
      <DemandDrawer
        key={`project-demand-${selectedId ?? "none"}-${editDemandId ?? "view"}-${selected ? "open" : "closed"}`}
        canManage={canManage && !isArchived}
        onChanged={refresh}
        onClose={closeDemand}
        onFeedback={showFeedback}
        open={Boolean(selected)}
        parents={parents}
        projects={projectOptions}
        slug={slug}
        startInEdit={Boolean(selected && editDemandId === selected.id)}
        timezone={timezone}
        {...(selected ? { demand: selected } : {})}
      />
      <DemandDrawer
        key={`project-demand-create-${demandCreateOpen ? "open" : "closed"}`}
        canManage={canManage && !isArchived}
        initialProjectId={project.id}
        onClose={closeDemand}
        onFeedback={showFeedback}
        open={demandCreateOpen}
        parents={parents}
        projects={projectOptions}
        slug={slug}
        timezone={timezone}
      />
      <ProjectDrawer
        key={`project-edit-${projectEditOpen ? "open" : "closed"}`}
        onClose={() => setProjectEditOpen(false)}
        open={projectEditOpen}
        project={project}
        slug={slug}
      />
    </PageContainer>
  );
}
