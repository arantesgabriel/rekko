import { DemandColumnMenu } from "@/components/demands/demand-column-menu";
import type { DemandListQuery } from "@/components/demands/demand-query";
import { DemandRow } from "@/components/demands/demand-row";
import type {
  DemandListItem,
  DemandProjectOption,
} from "@/modules/projects/service";

export function DemandList({
  canManage,
  context,
  counts,
  demands,
  onChanged,
  onEdit,
  onFeedback,
  onOpen,
  projects,
  query,
  slug,
  timezone,
}: {
  canManage?: boolean;
  context: "workspace" | "project";
  demands: DemandListItem[];
  onChanged?: () => void;
  onEdit?: (demandId: string) => void;
  onFeedback?: (message: string) => void;
  onOpen: (demandId: string) => void;
  projects?: DemandProjectOption[];
  query?: DemandListQuery;
  counts?: { all: number; active: number; done: number };
  slug: string;
  timezone: string;
}) {
  return (
    <section
      aria-label={context === "workspace" ? "Demandas" : "Demandas do projeto"}
      className={`demand-list demand-list--${context}`}
    >
      <div className="demand-list__head">
        {query ? (
          <>
            <DemandColumnMenu
              label="Demanda"
              options={[
                { label: "A–Z", sort: "title", dir: "asc" },
                { label: "Z–A", sort: "title", dir: "desc" },
              ]}
              query={query}
            />
            {context === "workspace" ? (
              <DemandColumnMenu
                label="Projeto"
                options={[
                  { label: "A–Z", sort: "project", dir: "asc" },
                  { label: "Z–A", sort: "project", dir: "desc" },
                ]}
                query={query}
              />
            ) : null}
            <DemandColumnMenu
              label="Status"
              options={[
                {
                  label: counts ? `Todas (${counts.all})` : "Todas",
                  status: "ALL",
                },
                {
                  label: counts ? `Ativas (${counts.active})` : "Ativas",
                  status: "ACTIVE",
                },
                {
                  label: counts ? `Concluídas (${counts.done})` : "Concluídas",
                  status: "DONE",
                },
              ]}
              query={query}
            />
            <DemandColumnMenu
              label="Registrado"
              options={[
                { label: "Mais tempo", sort: "tracked", dir: "desc" },
                { label: "Menos tempo", sort: "tracked", dir: "asc" },
              ]}
              query={query}
            />
            <DemandColumnMenu
              label="Estimativa"
              options={[
                { label: "Maior estimativa", sort: "estimate", dir: "desc" },
                { label: "Menor estimativa", sort: "estimate", dir: "asc" },
              ]}
              query={query}
            />
            {context === "workspace" ? (
              <DemandColumnMenu
                align="end"
                label="Atualizado"
                options={[
                  { label: "Mais recente", sort: "updated", dir: "desc" },
                  { label: "Mais antigo", sort: "updated", dir: "asc" },
                ]}
                query={query}
              />
            ) : null}
          </>
        ) : (
          <>
            <span>Demanda</span>
            {context === "workspace" ? <span>Projeto</span> : null}
            <span>Status</span>
            <span>Registrado</span>
            <span>Estimativa</span>
            {context === "workspace" ? <span>Atualizado</span> : null}
          </>
        )}
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
            {...(canManage !== undefined ? { canManage } : {})}
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
