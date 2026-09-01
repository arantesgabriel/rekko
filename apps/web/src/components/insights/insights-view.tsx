import type { CSSProperties } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { formatEstimate } from "@/modules/projects/domain";
import type { InsightsResult } from "@/modules/insights/service";

export function InsightsView({ data }: { data: InsightsResult }) {
  const { aggregation } = data;
  const periodLabel = getPeriodLabel(
    data.period.period,
    data.period.start,
    data.period.end,
  );
  const hasTracked = aggregation.trackedSeconds > 0;
  const maxProjectSeconds = Math.max(
    ...aggregation.projects.map((project) => project.trackedSeconds),
    1,
  );
  const maxWorkItemSeconds = Math.max(
    ...aggregation.workItems.map((item) => item.trackedSeconds),
    1,
  );

  return (
    <div className="insights-page">
      <div className="insights-toolbar">
        <div>
          <span className="eyebrow">{periodLabel}</span>
          <p className="insights-toolbar__timezone">
            Horários em {data.timezone}
          </p>
        </div>
        <InsightsFilters
          period={data.period.period}
          projectId={data.period.projectId}
          projects={data.projects}
          start={data.period.start}
          end={data.period.end}
        />
      </div>

      {!hasTracked ? (
        <EmptyState
          description="Escolha outro período ou registre seu primeiro bloco de trabalho para entender sua jornada."
          title="Nenhum tempo registrado neste período."
        />
      ) : (
        <>
          <section className="insights-summary" aria-label="Resumo do período">
            <Metric
              label="Tracked"
              value={formatDuration(aggregation.trackedSeconds)}
            />
            {aggregation.comparison ? (
              <>
                <Metric
                  label="Estimated"
                  value={formatEstimate(
                    aggregation.comparison.estimatedMinutes,
                  )}
                />
                <Metric
                  label="Difference"
                  value={formatDifference(
                    aggregation.comparison.differenceSeconds,
                  )}
                />
              </>
            ) : null}
          </section>

          <InsightSection title="Hours by Project">
            <BarList
              ariaLabel="Horas registradas por projeto"
              items={aggregation.projects.map((project) => ({
                id: project.projectId,
                label: project.projectName,
                detail: undefined,
                value: formatDuration(project.trackedSeconds),
                ratio: project.trackedSeconds / maxProjectSeconds,
              }))}
            />
          </InsightSection>

          <InsightSection title="Hours by Work Item">
            <BarList
              ariaLabel="Horas registradas por demanda"
              items={aggregation.workItems.map((item) => ({
                id: `${item.projectId}:${item.workItemId ?? "project-only"}`,
                label: item.workItemId
                  ? item.workItemTitle
                  : `${item.projectName} · Somente projeto`,
                detail: item.workItemId ? item.projectName : undefined,
                value: formatDuration(item.trackedSeconds),
                ratio: item.trackedSeconds / maxWorkItemSeconds,
              }))}
            />
          </InsightSection>

          <InsightSection
            description="A comparação usa a estimativa do próprio Project quando disponível. Caso contrário, considera apenas Work Items estimados com tempo registrado no período."
            title="Estimated vs Actual"
          >
            <div className="insights-comparison-summary">
              {aggregation.comparison ? (
                <ComparisonRow
                  difference={aggregation.comparison.differenceSeconds}
                  estimated={aggregation.comparison.estimatedMinutes}
                  label="Total comparável"
                  tracked={aggregation.comparison.trackedSeconds}
                />
              ) : (
                <p className="insights-note">
                  Nenhuma estimativa disponível para este período.
                </p>
              )}
            </div>
            {aggregation.comparisonItems.length ? (
              <div
                className="insights-comparison-list"
                aria-label="Comparação por demanda"
              >
                {aggregation.comparisonItems.map((item) => (
                  <ComparisonRow
                    difference={
                      item.trackedSeconds - (item.estimatedMinutes ?? 0) * 60
                    }
                    estimated={item.estimatedMinutes ?? 0}
                    label={item.workItemTitle}
                    detail={item.projectName}
                    tracked={item.trackedSeconds}
                    key={item.workItemId}
                  />
                ))}
              </div>
            ) : null}
            {aggregation.comparisonProjects.length ? (
              <div
                className="insights-comparison-list"
                aria-label="Comparação por projeto"
              >
                {aggregation.comparisonProjects.map((project) => (
                  <ComparisonRow
                    difference={project.comparison.differenceSeconds}
                    estimated={project.comparison.estimatedMinutes}
                    label={project.projectName}
                    detail={
                      project.comparison.source === "PROJECT"
                        ? "Estimativa do projeto"
                        : "Work Items estimados"
                    }
                    tracked={project.comparison.trackedSeconds}
                    key={project.projectId}
                  />
                ))}
              </div>
            ) : null}
          </InsightSection>
        </>
      )}
    </div>
  );
}

function InsightsFilters({
  period,
  projectId,
  projects,
  start,
  end,
}: {
  period: string;
  projectId: string | undefined;
  projects: InsightsResult["projects"];
  start: string | undefined;
  end: string | undefined;
}) {
  return (
    <form className="insights-filters" method="get">
      <label>
        <span>Período</span>
        <select defaultValue={period} name="period">
          <option value="today">Hoje</option>
          <option value="this_week">Esta semana</option>
          <option value="last_week">Semana passada</option>
          <option value="this_month">Este mês</option>
          <option value="custom">Personalizado</option>
        </select>
      </label>
      <label>
        <span>Projeto</span>
        <select defaultValue={projectId ?? "all"} name="projectId">
          <option value="all">Todos os projetos</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      {period === "custom" ? (
        <>
          <label>
            <span>De</span>
            <input defaultValue={start} name="start" type="date" />
          </label>
          <label>
            <span>Até</span>
            <input defaultValue={end} name="end" type="date" />
          </label>
        </>
      ) : null}
      <button className="button button--secondary" type="submit">
        Aplicar
      </button>
    </form>
  );
}

function InsightSection({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className="insights-section" aria-labelledby={`${title}-title`}>
      <div className="insights-section__heading">
        <h2 className="section-title" id={`${title}-title`}>
          {title}
        </h2>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="insights-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function BarList({
  ariaLabel,
  items,
}: {
  ariaLabel: string;
  items: Array<{
    id: string;
    label: string;
    detail: string | undefined;
    value: string;
    ratio: number;
  }>;
}) {
  return (
    <ul className="insights-bar-list" aria-label={ariaLabel}>
      {items.map((item) => (
        <li key={item.id}>
          <div className="insights-bar-list__label">
            <div>
              <strong>{item.label}</strong>
              {item.detail ? <small>{item.detail}</small> : null}
            </div>
            <span>{item.value}</span>
          </div>
          <div className="insights-bar" aria-hidden="true">
            <span
              style={
                { "--bar-ratio": Math.max(item.ratio, 0.02) } as CSSProperties
              }
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ComparisonRow({
  detail,
  difference,
  estimated,
  label,
  tracked,
}: {
  detail?: string;
  difference: number;
  estimated: number;
  label: string;
  tracked: number;
}) {
  const max = Math.max(estimated * 60, tracked, 1);
  return (
    <article className="insights-comparison-row">
      <div className="insights-comparison-row__heading">
        <div>
          <strong>{label}</strong>
          {detail ? <small>{detail}</small> : null}
        </div>
        <span>{formatDifference(difference)}</span>
      </div>
      <div className="insights-comparison-row__values">
        <div>
          <span>Estimated</span>
          <strong>{formatEstimate(estimated)}</strong>
          <i
            style={{ "--bar-ratio": (estimated * 60) / max } as CSSProperties}
          />
        </div>
        <div>
          <span>Tracked</span>
          <strong>{formatDuration(tracked)}</strong>
          <i
            data-kind="tracked"
            style={{ "--bar-ratio": tracked / max } as CSSProperties}
          />
        </div>
      </div>
    </article>
  );
}

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

function formatDifference(seconds: number) {
  if (seconds === 0) return "0m";
  return `${seconds > 0 ? "+" : "-"}${formatDuration(Math.abs(seconds))}`;
}

function getPeriodLabel(period: string, start?: string, end?: string) {
  if (period === "today") return "Hoje";
  if (period === "this_week") return "Esta semana";
  if (period === "last_week") return "Semana passada";
  if (period === "this_month") return "Este mês";
  return start && end ? `${start} → ${end}` : "Período personalizado";
}
