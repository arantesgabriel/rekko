import { ProjectDemandTable } from "@/components/projects/project-demand-table";
import { WorkItemFilters } from "@/components/projects/work-item-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { PageToolbar } from "@/components/ui/page-toolbar";
import type { DemandListItem } from "@/modules/projects/service";

export function ProjectDemandsPanel({
  demands,
  filter,
  onOpenDemand,
}: {
  demands: DemandListItem[];
  filter: { kind: string; query: string; status: string };
  onOpenDemand: (demandId: string) => void;
}) {
  const filtered =
    Boolean(filter.query) || filter.status !== "ALL" || filter.kind !== "ALL";

  return (
    <section
      aria-labelledby="project-demands-title"
      className="project-demands-panel"
    >
      <h2 className="section-title" id="project-demands-title">
        Demandas
      </h2>
      <PageToolbar label="Busca e filtros de demandas">
        <WorkItemFilters
          compact
          hiddenFields={{ view: "demands" }}
          kind={filter.kind}
          query={filter.query}
          status={filter.status}
        />
      </PageToolbar>
      {demands.length === 0 ? (
        <EmptyState
          description={
            filtered
              ? "Ajuste a busca ou os filtros para encontrar outras demandas."
              : "Crie a primeira demanda deste projeto na área de Demandas do workspace."
          }
          title={
            filtered
              ? "Nenhuma demanda encontrada"
              : "Nenhuma demanda neste projeto"
          }
        />
      ) : (
        <ProjectDemandTable demands={demands} onOpen={onOpenDemand} />
      )}
    </section>
  );
}
