import Link from "next/link";

import { ProjectDemandTable } from "@/components/projects/project-demand-table";
import { formatDuration } from "@/components/projects/project-format";
import { EmptyState } from "@/components/ui/empty-state";
import type {
  DemandListItem,
  ProjectSummary,
} from "@/modules/projects/service";

const RECENT_LIMIT = 5;

export function ProjectOverview({
  demandsHref,
  onOpenDemand,
  slug,
  summary,
  timezone,
  unfilteredDemands,
}: {
  demandsHref: string;
  onOpenDemand: (demandId: string) => void;
  slug: string;
  summary: ProjectSummary;
  timezone: string;
  unfilteredDemands: DemandListItem[];
}) {
  const completedCount = Math.max(
    0,
    summary.demandCount - summary.activeDemandCount,
  );
  const percent =
    summary.demandCount === 0
      ? 0
      : Math.round((completedCount / summary.demandCount) * 100);
  const recent = [...unfilteredDemands]
    .sort((a, b) => {
      const aAt = a.lastActivityAt?.getTime() ?? 0;
      const bAt = b.lastActivityAt?.getTime() ?? 0;
      return bAt - aAt;
    })
    .slice(0, RECENT_LIMIT);

  return (
    <div className="project-overview">
      <section
        aria-label="Tempo e progresso"
        className="project-overview__metrics"
      >
        <div className="project-time-summary">
          <p className="project-kpi-label">Tempo registrado</p>
          <p className="project-kpi-value">
            {formatDuration(summary.trackedSeconds)}
          </p>
        </div>
        <div className="project-progress">
          <p className="project-kpi-label">Progresso</p>
          <p className="project-kpi-value">{percent}%</p>
          <p className="project-progress__copy">
            {summary.demandCount === 0
              ? "Nenhuma demanda ainda"
              : `${completedCount} de ${summary.demandCount} demandas concluídas`}
          </p>
          <div
            aria-label={`${percent}% das demandas concluídas`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={percent}
            className="project-progress-bar"
            role="progressbar"
          >
            <span style={{ width: `${percent}%` }} />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="project-recent-title"
        className="project-overview__recent"
      >
        <div className="project-overview__recent-head">
          <h2 className="section-title" id="project-recent-title">
            Demandas recentes
          </h2>
          <Link className="project-overview__all" href={demandsHref}>
            Ver todas →
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            description="Crie a primeira demanda deste projeto na aba Demandas."
            title="Nenhuma demanda neste projeto"
          />
        ) : (
          <ProjectDemandTable
            demands={recent}
            onOpen={onOpenDemand}
            slug={slug}
            timezone={timezone}
          />
        )}
      </section>
    </div>
  );
}
