import { formatDuration } from "@/components/projects/project-format";
import { formatEstimate, workItemStatusLabel } from "@/modules/projects/domain";
import type { DemandListItem } from "@/modules/projects/service";

export function ProjectDemandTable({
  demands,
  onOpen,
}: {
  demands: DemandListItem[];
  onOpen: (demandId: string) => void;
}) {
  return (
    <div className="project-demand-table">
      <div className="project-demand-table__head" aria-hidden="true">
        <span>Demanda</span>
        <span>Status</span>
        <span>Registrado</span>
        <span>Estimativa</span>
        <span />
      </div>
      <ul className="project-demand-table__body">
        {demands.map((demand) => (
          <li key={demand.id}>
            <button
              aria-label={`Abrir ${demand.title}`}
              className="project-demand-row"
              onClick={() => onOpen(demand.id)}
              type="button"
            >
              <span className="project-demand-row__title">
                {demand.externalIdentifier ? (
                  <span className="project-demand-row__key">
                    {demand.externalIdentifier}
                  </span>
                ) : null}
                <strong>{demand.title}</strong>
              </span>
              <span
                className={`demand-status demand-status--${demand.status.toLowerCase()}`}
              >
                <span aria-hidden="true" />
                {workItemStatusLabel[demand.status]}
              </span>
              <span className="project-demand-row__metric">
                {demand.trackedSeconds > 0
                  ? formatDuration(demand.trackedSeconds)
                  : "—"}
                <span className="project-demand-row__metric-label">
                  {" "}
                  registrado
                </span>
              </span>
              <span className="project-demand-row__metric">
                {demand.estimatedMinutes
                  ? formatEstimate(demand.estimatedMinutes)
                  : "—"}
                <span className="project-demand-row__metric-label">
                  {" "}
                  estimado
                </span>
              </span>
              <span aria-hidden="true" className="project-demand-row__go">
                →
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
