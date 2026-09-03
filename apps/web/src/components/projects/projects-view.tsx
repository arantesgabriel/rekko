"use client";

import Link from "next/link";
import { useCallback, useState, type CSSProperties } from "react";

import { ProjectDrawer } from "@/components/projects/project-drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { formatEstimate, projectStatusLabel } from "@/modules/projects/domain";
import type { ProjectListItem } from "@/modules/projects/service";

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

export function ProjectsView({
  canManage,
  notice,
  projects,
  slug,
  timezone,
}: {
  canManage: boolean;
  notice?: string;
  projects: ProjectListItem[];
  slug: string;
  timezone: string;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <PageContainer width="lg">
      <PageHeader
        actions={
          canManage ? (
            <>
              <Link
                className="button button--secondary"
                href={`/w/${slug}/work/new?source=linear`}
              >
                Importar do Linear
              </Link>
              <button
                className="button button--primary"
                onClick={() => setDrawerOpen(true)}
                type="button"
              >
                <span aria-hidden="true">+</span> Criar projeto
              </button>
            </>
          ) : undefined
        }
        description="Projetos e contextos que dão forma ao trabalho do Workspace."
        title="Projetos"
      />
      {notice ? (
        <p className="form-message form-message--success" role="status">
          {notice}
        </p>
      ) : null}
      {projects.length === 0 ? (
        <EmptyState
          actions={
            canManage ? (
              <button
                className="button button--primary"
                onClick={() => setDrawerOpen(true)}
                type="button"
              >
                Criar projeto
              </button>
            ) : (
              <small>
                Proprietário ou administrador pode criar o primeiro projeto.
              </small>
            )
          }
          description="Projetos ajudam a organizar suas demandas e entender onde seu tempo está sendo investido."
          title="Nenhum projeto ainda"
        />
      ) : (
        <section className="project-grid" aria-label="Projetos ativos">
          {projects.map((item, index) => (
            <Link
              className="project-card"
              href={`/w/${slug}/projects/${item.id}`}
              key={item.id}
              style={{ "--project-index": index } as CSSProperties}
            >
              <div className="project-card__top">
                <span className="source-badge">
                  {item.source === "LINEAR" ? "Linear" : "Manual"}
                </span>
                <span
                  className={`status-badge status-badge--${item.status.toLowerCase()}`}
                >
                  {projectStatusLabel[item.status]}
                </span>
              </div>
              <div className="project-card__identity">
                <h2 className="card-title">{item.name}</h2>
                {item.description ? <p>{item.description}</p> : null}
              </div>
              <div className="project-card__primary-metric">
                <span>Tempo registrado</span>
                <strong>{formatDuration(item.trackedSeconds)}</strong>
              </div>
              <dl className="project-card__metrics">
                <div>
                  <dt>Demandas</dt>
                  <dd>{item.workItemCount || "—"}</dd>
                </div>
                <div>
                  <dt>Ativas</dt>
                  <dd>{item.activeDemandCount || "—"}</dd>
                </div>
                <div>
                  <dt>Última atividade</dt>
                  <dd>{formatActivity(item.lastActivityAt, timezone)}</dd>
                </div>
              </dl>
              <span className="project-card__estimate">
                {item.estimatedMinutes
                  ? `Estimativa · ${formatEstimate(item.estimatedMinutes)}`
                  : "Sem estimativa"}
              </span>
            </Link>
          ))}
        </section>
      )}
      <ProjectDrawer
        key={`project-create-${drawerOpen ? "open" : "closed"}`}
        onClose={closeDrawer}
        open={drawerOpen}
        slug={slug}
      />
    </PageContainer>
  );
}
