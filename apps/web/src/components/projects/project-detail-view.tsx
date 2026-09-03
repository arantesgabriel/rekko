"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { ProjectActionsMenu } from "@/components/projects/project-actions-menu";
import { ProjectDrawer } from "@/components/projects/project-drawer";
import { WorkItemFilters } from "@/components/projects/work-item-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer } from "@/components/ui/page-container";
import { PageToolbar } from "@/components/ui/page-toolbar";
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
  if (!date) return null;
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
  canManage,
  demands,
  filter,
  notice,
  project,
  summary,
  slug,
  timezone,
}: {
  canManage: boolean;
  demands: DemandListItem[];
  filter: { kind: string; query: string; status: string };
  notice?: string;
  project: ProjectDetail;
  summary: ProjectSummary;
  slug: string;
  timezone: string;
}) {
  const router = useRouter();
  const [projectEditOpen, setProjectEditOpen] = useState(false);
  const isLinear = project.source === "LINEAR";
  const isArchived = Boolean(project.archivedAt);

  return (
    <PageContainer width="lg">
      <div className="project-detail-page">
        <Link className="back-link" href={`/w/${slug}/projects`}>
          ← Projetos
        </Link>
        <header className="project-detail-header">
          <div className="project-detail-header__copy">
            <h1 className="page-title">{project.name}</h1>
            <div className="project-detail-header__meta">
              <span>{isLinear ? "Linear" : "Manual"}</span>
              <span aria-hidden="true">·</span>
              <span
                className={`status-badge status-badge--${project.status.toLowerCase()}`}
              >
                {projectStatusLabel[project.status]}
              </span>
            </div>
            {project.description ? (
              <p className="page-description">{project.description}</p>
            ) : null}
          </div>
          <div className="project-detail-header__actions">
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
            <strong>
              {formatDuration(summary.trackedSeconds)} registrados
            </strong>
          </div>
          <div className="project-detail-summary__meta">
            <span>
              {summary.demandCount}{" "}
              {summary.demandCount === 1 ? "demanda" : "demandas"}
            </span>
            {summary.lastActivityAt ? (
              <span>
                Última atividade{" "}
                {formatActivity(summary.lastActivityAt, timezone)}
              </span>
            ) : null}
            {project.estimatedMinutes ? (
              <span className="project-detail-summary__estimate">
                Estimativa · {formatEstimate(project.estimatedMinutes)}
              </span>
            ) : null}
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
            actions={
              <Link
                className="button button--ghost button--sm"
                href={`/w/${slug}/work?projectId=${project.id}`}
              >
                Abrir em Demandas
              </Link>
            }
            description={`${demands.length} ${demands.length === 1 ? "demanda" : "demandas"} neste projeto · ações disponíveis em Demandas`}
            id="project-demands-title"
            title="Demandas"
          />
          <PageToolbar label="Busca e filtros de demandas">
            <WorkItemFilters
              compact
              kind={filter.kind}
              query={filter.query}
              status={filter.status}
            />
          </PageToolbar>
          {demands.length === 0 ? (
            <EmptyState
              description={
                filter.query || filter.status !== "ALL" || filter.kind !== "ALL"
                  ? "Ajuste a busca ou os filtros para encontrar outras demandas."
                  : "Abra Demandas para criar a primeira demanda deste projeto."
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
                  <div
                    className="project-demand-row__title"
                    title={demand.title}
                  >
                    {demand.externalIdentifier ? (
                      <span>{demand.externalIdentifier}</span>
                    ) : null}
                    <strong>{demand.title}</strong>
                  </div>
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
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
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
