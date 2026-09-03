import { DemandRow } from "@/components/demands/demand-row";
import type {
  DemandListItem,
  DemandProjectOption,
} from "@/modules/projects/service";

export function DemandList({
  activeTimerStatus,
  activeTimerWorkItemId,
  canManage,
  context,
  demands,
  hasActiveTimer,
  onChanged,
  onEdit,
  onFeedback,
  onOpen,
  projects,
  slug,
  timezone,
}: {
  activeTimerStatus?: "RUNNING" | "PAUSED" | null;
  activeTimerWorkItemId?: string | null;
  canManage?: boolean;
  context: "workspace" | "project";
  demands: DemandListItem[];
  hasActiveTimer?: boolean;
  onChanged?: () => void;
  onEdit?: (demandId: string) => void;
  onFeedback?: (message: string) => void;
  onOpen: (demandId: string) => void;
  projects?: DemandProjectOption[];
  slug: string;
  timezone: string;
}) {
  return (
    <section
      aria-label={context === "workspace" ? "Demandas" : "Demandas do projeto"}
      className={`demand-list demand-list--${context}`}
    >
      <div className="demand-list__head" aria-hidden="true">
        <span>Demanda</span>
        {context === "workspace" ? <span>Projeto</span> : null}
        <span>Status</span>
        <span>Registrado</span>
        <span>Estimativa</span>
        {context === "workspace" ? <span>Atualizado</span> : null}
        <span />
      </div>
      <div className="demand-list__rows">
        {demands.map((demand) => (
          <DemandRow
            context={context}
            demand={demand}
            key={demand.id}
            onOpen={onOpen}
            slug={slug}
            timezone={timezone}
            {...(activeTimerStatus !== undefined ? { activeTimerStatus } : {})}
            {...(activeTimerWorkItemId !== undefined
              ? { activeTimerWorkItemId }
              : {})}
            {...(canManage !== undefined ? { canManage } : {})}
            {...(hasActiveTimer !== undefined ? { hasActiveTimer } : {})}
            {...(onChanged ? { onChanged } : {})}
            {...(onEdit ? { onEdit: () => onEdit(demand.id) } : {})}
            {...(onFeedback ? { onFeedback } : {})}
            {...(projects ? { projects } : {})}
          />
        ))}
      </div>
    </section>
  );
}
