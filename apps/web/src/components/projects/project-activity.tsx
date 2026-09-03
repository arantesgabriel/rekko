import {
  formatActivityDay,
  formatClock,
  formatDuration,
} from "@/components/projects/project-format";
import { EmptyState } from "@/components/ui/empty-state";
import type { DemandListItem } from "@/modules/projects/service";

type ActivityItem = {
  id: string;
  kind: "time" | "done";
  title: string;
  at: Date;
  durationSeconds?: number;
};

function buildActivity(demands: DemandListItem[]): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const demand of demands) {
    for (const record of demand.recentRecords) {
      if (record.durationSeconds <= 0) continue;
      items.push({
        at: record.endedAt ?? record.startedAt,
        durationSeconds: record.durationSeconds,
        id: `time-${record.id}`,
        kind: "time",
        title: demand.title,
      });
    }
    if (demand.status === "DONE" && demand.lastActivityAt) {
      items.push({
        at: demand.lastActivityAt,
        id: `done-${demand.id}`,
        kind: "done",
        title: demand.title,
      });
    }
  }
  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 20);
}

export function ProjectActivity({
  demands,
  timezone,
}: {
  demands: DemandListItem[];
  timezone: string;
}) {
  const items = buildActivity(demands);

  if (items.length === 0) {
    return (
      <EmptyState
        description="Quando houver tempo registrado ou demandas concluídas, o histórico aparece aqui."
        title="Nenhuma atividade neste projeto"
      />
    );
  }

  return (
    <section
      aria-labelledby="project-activity-title"
      className="project-activity"
    >
      <h2 className="section-title" id="project-activity-title">
        Atividade
      </h2>
      <ol className="project-activity__list">
        {items.map((item) => {
          const day = formatActivityDay(item.at, timezone);
          const time = formatClock(item.at, timezone);
          const when = `${day} · ${time}`;
          return (
            <li className="project-activity__item" key={item.id}>
              <span
                aria-hidden="true"
                className={`project-activity__mark project-activity__mark--${item.kind}`}
              >
                {item.kind === "done" ? "✓" : ""}
              </span>
              <p>
                {item.kind === "time" ? (
                  <>
                    {formatDuration(item.durationSeconds ?? 0)} registrada em “
                    {item.title}”
                  </>
                ) : (
                  <>“{item.title}” concluída</>
                )}
              </p>
              <time dateTime={item.at.toISOString()}>{when}</time>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
