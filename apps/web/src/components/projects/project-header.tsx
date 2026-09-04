import { formatActivityDay } from "@/components/projects/project-format";
import { ProjectActionsMenu } from "@/components/projects/project-actions-menu";
import { projectStatusLabel } from "@/modules/projects/domain";
import type { ProjectListItem } from "@/modules/projects/service";

export function ProjectHeader({
  canManage,
  demandCount,
  lastActivityAt,
  onArchive,
  onEdit,
  project,
  slug,
  timezone,
}: {
  canManage: boolean;
  demandCount: number;
  lastActivityAt: Date | null;
  onArchive: () => void;
  onEdit: () => void;
  project: Pick<
    ProjectListItem,
    "id" | "name" | "description" | "source" | "status"
  > & { archivedAt: Date | null };
  slug: string;
  timezone: string;
}) {
  const isLinear = project.source === "LINEAR";
  const isArchived = Boolean(project.archivedAt);
  const updated = formatActivityDay(lastActivityAt, timezone);

  return (
    <header className="project-header">
      <div className="project-header__copy">
        <h1 className="page-title">{project.name}</h1>
        {project.description ? (
          <p className="page-description">{project.description}</p>
        ) : null}
        <p className="project-header__meta">
          <span
            className={`project-header__status project-header__status--${project.status.toLowerCase()}`}
          >
            <span aria-hidden="true" />
            {projectStatusLabel[project.status]}
          </span>
          <span>{isLinear ? "Linear" : "Manual"}</span>
          <span>
            {demandCount} {demandCount === 1 ? "demanda" : "demandas"}
          </span>
          {updated ? (
            <span>
              {updated === "Hoje"
                ? "Atualizado hoje"
                : `Atualizado em ${updated}`}
            </span>
          ) : null}
        </p>
      </div>
      {canManage && !isArchived ? (
        <div className="project-header__actions">
          <ProjectActionsMenu
            onChanged={onArchive}
            onEdit={onEdit}
            project={project}
            slug={slug}
          />
        </div>
      ) : null}
    </header>
  );
}
