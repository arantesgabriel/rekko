"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageToolbar } from "@/components/ui/page-toolbar";
import { formatEstimate } from "@/modules/projects/domain";
import type {
  InsightComparison,
  InsightDay,
  InsightProject,
  InsightWorkItem,
} from "@/modules/insights/domain";
import type { InsightsResult } from "@/modules/insights/service";

const MIN_DISPLAY_SECONDS = 60;

export function InsightsView({ data }: { data: InsightsResult }) {
  const { aggregation } = data;
  const hasTracked = aggregation.trackedSeconds >= MIN_DISPLAY_SECONDS;
  const highlights = hasTracked ? buildHighlights(aggregation) : [];
  const rankedWorkItems = aggregation.workItems.filter(
    (item) => item.trackedSeconds >= MIN_DISPLAY_SECONDS,
  );
  const rankedProjects = aggregation.projects.filter(
    (item) => item.trackedSeconds >= MIN_DISPLAY_SECONDS,
  );

  return (
    <div className="insights-page">
      <div className="insights-intro">
        <PageHeader
          description="Entenda como seu tempo foi distribuído e compare o realizado com o planejado."
          title="Insights"
        />
        <p className="insights-timezone">Horários em {data.timezone}</p>
      </div>

      <PageToolbar label="Filtros de insights">
        <InsightsFilters
          period={data.period.period}
          projectId={data.period.projectId}
          projects={data.projects}
          start={data.period.start}
          end={data.period.end}
        />
      </PageToolbar>

      {!hasTracked ? (
        <EmptyState
          actions={
            <a
              className="button button--secondary"
              href={`/w/${data.context.slug}`}
            >
              Ir para Hoje
            </a>
          }
          description="Registre tempo em uma demanda para começar a visualizar seus insights."
          title="Nenhum tempo registrado neste período."
        />
      ) : (
        <div className="insights-dashboard" aria-label="Resumo de insights">
          <section className="insights-summary" aria-label="Resumo do período">
            <MetricStat
              emphasis
              label="Tempo registrado"
              note="Todo o tempo com registro"
              seconds={aggregation.trackedSeconds}
            />
            <MetricStat
              label="Tempo estimado"
              note={
                aggregation.comparison
                  ? getComparisonSourceLabel(aggregation.comparison.source)
                  : "Nenhuma estimativa disponível"
              }
              seconds={
                aggregation.comparison?.estimatedMinutes
                  ? aggregation.comparison.estimatedMinutes * 60
                  : null
              }
              value={
                aggregation.comparison
                  ? formatEstimate(aggregation.comparison.estimatedMinutes)
                  : "—"
              }
            />
            <MetricStat
              label="Diferença"
              note={
                aggregation.comparison
                  ? aggregation.comparison.differenceSeconds > 0
                    ? "Acima do planejado"
                    : aggregation.comparison.differenceSeconds < 0
                      ? "Abaixo do planejado"
                      : "Dentro do planejado"
                  : "Apenas tempo comparável"
              }
              seconds={aggregation.comparison?.differenceSeconds ?? null}
              tone={getDifferenceTone(aggregation.comparison)}
              value={
                aggregation.comparison
                  ? formatDifference(aggregation.comparison.differenceSeconds)
                  : "—"
              }
              valueFormatter={(value) => formatDifference(value)}
            />
            <MetricStat
              label="Projetos trabalhados"
              note="No período selecionado"
              seconds={rankedProjects.length}
              value={String(rankedProjects.length)}
              valueFormatter={(value) => String(Math.round(value))}
            />
          </section>

          <div className="insights-primary-grid">
            <TimeTrendChart days={aggregation.days} />
            {highlights.length ? (
              <InsightHighlights items={highlights} />
            ) : null}
          </div>

          <div className="insights-distribution-grid">
            <ProjectDistribution
              projects={rankedProjects}
              totalSeconds={aggregation.trackedSeconds}
            />
            <DemandDistribution
              items={rankedWorkItems}
              totalSeconds={aggregation.trackedSeconds}
            />
          </div>

          <EstimateVsActual
            aggregation={aggregation}
            totalSeconds={aggregation.trackedSeconds}
          />
        </div>
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
  const periodLabel = getPeriodLabel(period, start, end);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const syncDisclosure = () => setFiltersOpen(media.matches);

    syncDisclosure();
    media.addEventListener("change", syncDisclosure);
    return () => media.removeEventListener("change", syncDisclosure);
  }, []);

  return (
    <details
      className="insights-filter-disclosure"
      onToggle={(event) => setFiltersOpen(event.currentTarget.open)}
      open={filtersOpen}
    >
      <summary>
        <span>
          <strong>Filtros</strong>
          <small>{periodLabel}</small>
        </span>
        <span className="button button--secondary button--sm">Editar</span>
      </summary>
      <form className="insights-filters" method="get">
        <InsightsFilterFields
          end={end}
          period={period}
          projectId={projectId}
          projects={projects}
          start={start}
        />
      </form>
    </details>
  );
}

function InsightsFilterFields({
  end,
  period,
  projectId,
  projects,
  start,
}: {
  end: string | undefined;
  period: string;
  projectId: string | undefined;
  projects: InsightsResult["projects"];
  start: string | undefined;
}) {
  return (
    <>
      <label>
        <span className="sr-only">Período</span>
        <select defaultValue={period} name="period">
          <option value="today">Hoje</option>
          <option value="this_week">Esta semana</option>
          <option value="last_week">Semana passada</option>
          <option value="this_month">Este mês</option>
          <option value="custom">Personalizado</option>
        </select>
      </label>
      <label>
        <span className="sr-only">Projeto</span>
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
      <button className="button button--secondary button--sm" type="submit">
        Aplicar
      </button>
    </>
  );
}

function MetricStat({
  emphasis,
  label,
  note,
  seconds,
  tone,
  value,
  valueFormatter,
}: {
  emphasis?: boolean;
  label: string;
  note: string;
  seconds?: number | null;
  tone?: "positive" | "negative" | "neutral";
  value?: string;
  valueFormatter?: (value: number) => string;
}) {
  const animatedValue = useAnimatedInteger(seconds ?? null);
  const displayValue =
    seconds === null || seconds === undefined
      ? (value ?? "—")
      : valueFormatter
        ? valueFormatter(animatedValue ?? seconds)
        : formatDuration(animatedValue ?? seconds);

  return (
    <article
      className={`insights-summary__metric${emphasis ? " is-emphasis" : ""}${
        tone ? ` is-${tone}` : ""
      }`}
    >
      <span>{label}</span>
      <strong>{displayValue}</strong>
      <p>{note}</p>
    </article>
  );
}

function TimeTrendChart({ days }: { days: InsightDay[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const scale = getChartScale(days);
  const registeredDays = days.filter(
    (day) => day.trackedSeconds >= MIN_DISPLAY_SECONDS,
  ).length;

  return (
    <section
      className="insights-panel insights-trend"
      aria-labelledby="trend-title"
    >
      <div className="insights-panel__header">
        <div>
          <h2 className="card-title" id="trend-title">
            Tempo ao longo do período
          </h2>
          <p>
            {registeredDays} de {days.length} dias com tempo registrado
          </p>
        </div>
      </div>

      <div className="insights-trend__chart" aria-labelledby="trend-title">
        <div className="insights-trend__axis" aria-hidden="true">
          {scale.ticks.map((tick) => (
            <span key={tick}>{formatAxisDuration(tick)}</span>
          ))}
        </div>
        <div
          className="insights-trend__plot"
          style={{ "--trend-columns": days.length } as CSSProperties}
        >
          <span className="insights-trend__guide is-top" aria-hidden="true" />
          <span
            className="insights-trend__guide is-middle"
            aria-hidden="true"
          />
          <span
            className="insights-trend__guide is-bottom"
            aria-hidden="true"
          />
          {days.map((day, index) => {
            const ratio = day.trackedSeconds / scale.max;
            const isActive = activeIndex === index;
            return (
              <div
                className={`insights-trend__slot${isActive ? " is-active" : ""}${
                  activeIndex !== null && !isActive ? " is-dimmed" : ""
                }${day.trackedSeconds === 0 ? " is-empty" : ""}`}
                key={day.date}
              >
                <button
                  aria-label={`${formatDateLabel(day.date)}: ${formatDuration(
                    day.trackedSeconds,
                  )} registrados`}
                  className="insights-trend__bar-hit"
                  onBlur={() => setActiveIndex(null)}
                  onClick={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  style={{ "--bar-ratio": ratio } as CSSProperties}
                  type="button"
                >
                  {day.trackedSeconds > 0 ? (
                    <span className="insights-trend__bar" aria-hidden="true" />
                  ) : null}
                  {isActive ? (
                    <TrendTooltip
                      day={day}
                      edge={getTooltipEdge(index, days.length)}
                    />
                  ) : null}
                </button>
                <span className="insights-trend__label">
                  {formatDayLabel(day.date, days.length)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TrendTooltip({
  day,
  edge,
}: {
  day: InsightDay;
  edge: "first" | "last" | "middle";
}) {
  return (
    <div className={`insights-chart-tooltip is-${edge}`} role="status">
      <strong>{formatTooltipDate(day.date)}</strong>
      <p>
        Registrado: <span>{formatDuration(day.trackedSeconds)}</span>
      </p>
    </div>
  );
}

function InsightHighlights({ items }: { items: Highlight[] }) {
  return (
    <section
      className="insights-panel insights-highlights"
      aria-labelledby="highlights-title"
    >
      <div className="insights-panel__header">
        <div>
          <h2 className="card-title" id="highlights-title">
            Destaques
          </h2>
          <p>Leituras rápidas do período</p>
        </div>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <span className="insights-highlights__bullet" aria-hidden="true" />
            <p>{item.content}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProjectDistribution({
  projects,
  totalSeconds,
}: {
  projects: InsightProject[];
  totalSeconds: number;
}) {
  return (
    <section
      className="insights-panel insights-distribution"
      aria-labelledby="projects-title"
    >
      <div className="insights-panel__header">
        <div>
          <h2 className="card-title" id="projects-title">
            Tempo por projeto
          </h2>
          <p>
            {projects.length === 1
              ? "Um projeto concentrou o período"
              : "Como o tempo se dividiu"}
          </p>
        </div>
      </div>
      <RankingList
        ariaLabel="Tempo registrado por projeto"
        compact={projects.length === 1}
        items={projects.map((project) => ({
          id: project.projectId,
          label: project.projectName,
          detail: project.estimatedMinutes
            ? `Estimativa ${formatEstimate(project.estimatedMinutes)}`
            : "Sem estimativa",
          seconds: project.trackedSeconds,
        }))}
        totalSeconds={totalSeconds}
      />
    </section>
  );
}

function DemandDistribution({
  items,
  totalSeconds,
}: {
  items: InsightWorkItem[];
  totalSeconds: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleItems = showAll ? items : items.slice(0, 5);
  const hasMore = items.length > 5;

  return (
    <section
      className="insights-panel insights-distribution"
      aria-labelledby="demands-title"
    >
      <div className="insights-panel__header">
        <div>
          <h2 className="card-title" id="demands-title">
            Tempo por demanda
          </h2>
          <p>
            {items.length === 1
              ? "Uma demanda com tempo registrado"
              : `${items.length} demandas com tempo registrado`}
          </p>
        </div>
      </div>
      <RankingList
        ariaLabel="Tempo registrado por demanda"
        items={visibleItems.map((item) => ({
          id: `${item.projectId}:${item.workItemId ?? "project-only"}`,
          label: item.workItemId
            ? item.workItemTitle
            : `${item.projectName} · Somente projeto`,
          detail: item.workItemId ? item.projectName : "Sem demanda vinculada",
          seconds: item.trackedSeconds,
        }))}
        totalSeconds={totalSeconds}
      />
      {hasMore ? (
        <button
          className="button button--ghost button--sm insights-ranking__toggle"
          onClick={() => setShowAll((current) => !current)}
          type="button"
        >
          {showAll ? "Mostrar menos" : `Ver todas as ${items.length} demandas`}
        </button>
      ) : null}
    </section>
  );
}

function RankingList({
  ariaLabel,
  compact,
  items,
  totalSeconds,
}: {
  ariaLabel: string;
  compact?: boolean;
  items: Array<{
    id: string;
    label: string;
    detail: string;
    seconds: number;
  }>;
  totalSeconds: number;
}) {
  return (
    <ul
      className={`insights-ranking${compact ? " is-compact" : ""}`}
      aria-label={ariaLabel}
    >
      {items.map((item, index) => {
        const percentage = totalSeconds
          ? Math.round((item.seconds / totalSeconds) * 100)
          : 0;
        return (
          <li className="insights-ranking__item" key={item.id}>
            <div className="insights-ranking__heading">
              <span className="insights-ranking__index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <strong title={item.label}>{item.label}</strong>
                <small>{item.detail}</small>
              </div>
              <span className="insights-ranking__value">
                {formatDuration(item.seconds)}
                <small>{percentage}%</small>
              </span>
            </div>
            <span
              className="insights-ranking__track"
              aria-hidden="true"
              style={
                {
                  "--ranking-ratio": item.seconds / Math.max(totalSeconds, 1),
                } as CSSProperties
              }
            >
              <span />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function EstimateVsActual({
  aggregation,
  totalSeconds,
}: {
  aggregation: InsightsResult["aggregation"];
  totalSeconds: number;
}) {
  const comparison = aggregation.comparison;
  return (
    <section
      className="insights-panel insights-comparison"
      aria-labelledby="comparison-title"
    >
      <div className="insights-panel__header">
        <div>
          <h2 className="card-title" id="comparison-title">
            Planejado vs realizado
          </h2>
          <p>
            {comparison
              ? formatComparableCoverage(
                  comparison.trackedSeconds,
                  totalSeconds,
                )
              : "Uma leitura da diferença entre estimativa e tempo registrado"}
          </p>
        </div>
        {comparison ? (
          <span
            className={`insights-difference ${getDifferenceTone(comparison)}`}
          >
            {formatDifference(comparison.differenceSeconds)}
            <small>
              {comparison.differenceSeconds > 0
                ? "Acima do planejado"
                : comparison.differenceSeconds < 0
                  ? "Abaixo do planejado"
                  : "Dentro do planejado"}
            </small>
          </span>
        ) : null}
      </div>

      {comparison ? (
        <>
          <div
            className="insights-comparison__summary"
            aria-label="Resumo do comparativo"
          >
            <ComparisonStat
              label="Estimado"
              value={formatEstimate(comparison.estimatedMinutes)}
            />
            <ComparisonStat
              label="Registrado"
              value={formatDuration(comparison.trackedSeconds)}
            />
          </div>
          <div
            className="insights-comparison__list"
            aria-label="Comparação por projeto"
          >
            {aggregation.comparisonProjects.map((project) => (
              <ComparisonRow
                comparison={project.comparison}
                detail={
                  project.comparison.source === "PROJECT"
                    ? "Estimativa do projeto"
                    : "Demandas estimadas"
                }
                label={project.projectName}
                key={project.projectId}
                showDifference={aggregation.comparisonProjects.length > 1}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="insights-inline-empty">
          <strong>Nenhuma estimativa disponível para este período.</strong>
          <p>
            Quando uma demanda tiver estimativa, ela aparecerá aqui para
            comparação.
          </p>
        </div>
      )}
    </section>
  );
}

function ComparisonStat({
  label,
  tone,
  value,
}: {
  label: string;
  tone?: "positive" | "negative" | "neutral";
  value: string;
}) {
  return (
    <div>
      <span>{label}</span>
      <strong className={tone ? `is-${tone}` : undefined}>{value}</strong>
    </div>
  );
}

function ComparisonRow({
  comparison,
  detail,
  label,
  showDifference,
}: {
  comparison: InsightComparison;
  detail: string;
  label: string;
  showDifference: boolean;
}) {
  const estimatedSeconds = comparison.estimatedMinutes * 60;
  const maxSeconds = Math.max(estimatedSeconds, comparison.trackedSeconds, 1);
  return (
    <article className="insights-comparison-row">
      <div className="insights-comparison-row__heading">
        <div>
          <strong>{label}</strong>
          <small>{detail}</small>
        </div>
        {showDifference ? (
          <span
            className={`insights-difference ${getDifferenceTone(comparison)}`}
          >
            {formatDifference(comparison.differenceSeconds)}
          </span>
        ) : null}
      </div>
      <div className="insights-comparison-row__bars">
        <ComparisonBar
          label="Estimado"
          seconds={estimatedSeconds}
          tone="muted"
          ratio={estimatedSeconds / maxSeconds}
        />
        <ComparisonBar
          label="Registrado"
          seconds={comparison.trackedSeconds}
          tone="violet"
          ratio={comparison.trackedSeconds / maxSeconds}
        />
      </div>
    </article>
  );
}

function ComparisonBar({
  label,
  ratio,
  seconds,
  tone,
}: {
  label: string;
  ratio: number;
  seconds: number;
  tone: "muted" | "violet";
}) {
  return (
    <div className="insights-comparison-bar">
      <div>
        <span>{label}</span>
        <strong>{formatDuration(seconds)}</strong>
      </div>
      <span className={`insights-comparison-bar__track is-${tone}`}>
        <span style={{ "--comparison-ratio": ratio } as CSSProperties} />
      </span>
    </div>
  );
}

type Highlight = { id: string; content: ReactNode };

function buildHighlights(aggregation: InsightsResult["aggregation"]) {
  const highlights: Highlight[] = [];
  const comparison = aggregation.comparison;

  if (comparison) {
    if (comparison.differenceSeconds > 0) {
      highlights.push({
        id: "over",
        content: (
          <>
            Você registrou{" "}
            <strong>
              {formatDuration(comparison.differenceSeconds)} acima do estimado
            </strong>
            .
          </>
        ),
      });
    } else if (comparison.differenceSeconds < 0) {
      highlights.push({
        id: "under",
        content: (
          <>
            Você registrou{" "}
            <strong>
              {formatDuration(Math.abs(comparison.differenceSeconds))} abaixo do
              estimado
            </strong>
            .
          </>
        ),
      });
    } else {
      highlights.push({
        id: "aligned",
        content: "O tempo registrado ficou alinhado ao estimado.",
      });
    }
  }

  const topProject = aggregation.projects[0];
  if (topProject && aggregation.projects.length > 1) {
    const percentage = Math.round(
      (topProject.trackedSeconds / aggregation.trackedSeconds) * 100,
    );
    highlights.push({
      id: "project",
      content: (
        <>
          <strong>{percentage}%</strong> do seu tempo ficou concentrado no
          projeto {topProject.projectName}.
        </>
      ),
    });
  }

  const busiestDay = aggregation.days.reduce<InsightDay | null>(
    (current, day) =>
      !current || day.trackedSeconds > current.trackedSeconds ? day : current,
    null,
  );
  if (busiestDay && busiestDay.trackedSeconds >= MIN_DISPLAY_SECONDS) {
    const weekday = capitalizeLabel(formatWeekdayLabel(busiestDay.date));
    highlights.push({
      id: "busy-day",
      content: (
        <>
          <strong>{weekday}</strong> foi o dia com maior volume:{" "}
          <strong>{formatDuration(busiestDay.trackedSeconds)}</strong>.
        </>
      ),
    });
  }

  return highlights.slice(0, 3);
}

function useAnimatedInteger(value: number | null) {
  const [displayValue, setDisplayValue] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setReduceMotion(media.matches);

    const initialSync = window.setTimeout(syncMotionPreference, 0);
    media.addEventListener("change", syncMotionPreference);
    return () => {
      window.clearTimeout(initialSync);
      media.removeEventListener("change", syncMotionPreference);
    };
  }, []);

  useEffect(() => {
    if (value === null || reduceMotion) return;

    const startedAt = performance.now();
    const duration = 420;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayValue(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion, value]);

  return value === null ? null : reduceMotion ? value : displayValue;
}

function getChartScale(days: InsightDay[]) {
  const max = Math.max(...days.map((day) => day.trackedSeconds), 1);
  const minute = 60;
  const candidates = [
    15 * minute,
    30 * minute,
    45 * minute,
    60 * minute,
    90 * minute,
    2 * 60 * minute,
    3 * 60 * minute,
    4 * 60 * minute,
    6 * 60 * minute,
    8 * 60 * minute,
    12 * 60 * minute,
    24 * 60 * minute,
  ];
  const niceMax =
    candidates.find((value) => value >= max) ??
    Math.ceil(max / (60 * minute)) * 60 * minute;
  return {
    max: niceMax,
    ticks: [niceMax, niceMax / 2, 0],
  };
}

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  if (total === 0) return "0s";
  if (total < 60) return `${total}s`;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return [hours ? `${hours}h` : "", minutes ? `${minutes}m` : ""]
    .filter(Boolean)
    .join(" ");
}

function formatAxisDuration(seconds: number) {
  if (seconds === 0) return "0m";
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours && rest) return `${hours}h ${rest}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

function formatDifference(seconds: number) {
  if (seconds === 0) return "0m";
  return `${seconds > 0 ? "+" : "−"}${formatDuration(Math.abs(seconds))}`;
}

function formatTooltipDate(date: string) {
  const weekday = capitalizeLabel(formatWeekdayLabel(date));
  const rest = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
    .format(new Date(`${date}T12:00:00Z`))
    .replace(" de ", " ")
    .replace(".", "");
  return `${weekday}, ${rest}`;
}

function capitalizeLabel(value: string) {
  if (!value) return value;
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
    weekday: "short",
  })
    .format(new Date(`${date}T12:00:00Z`))
    .replace(".", "");
}

function formatWeekdayLabel(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    weekday: "long",
  }).format(new Date(`${date}T12:00:00Z`));
}

function formatDayLabel(date: string, count: number) {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (count <= 7) {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "UTC",
      weekday: "short",
    })
      .format(parsed)
      .replace(".", "")
      .slice(0, 3);
  }
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    timeZone: "UTC",
  }).format(parsed);
}

function getTooltipEdge(index: number, count: number) {
  if (index === 0) return "first" as const;
  if (index === count - 1) return "last" as const;
  return "middle" as const;
}

function getPeriodLabel(period: string, start?: string, end?: string) {
  if (period === "today") return "Hoje";
  if (period === "this_week") return "Esta semana";
  if (period === "last_week") return "Semana passada";
  if (period === "this_month") return "Este mês";
  return start && end
    ? `${formatDateLabel(start)} → ${formatDateLabel(end)}`
    : "Período personalizado";
}

function getComparisonSourceLabel(source: InsightComparison["source"]) {
  if (source === "PROJECT") return "Estimativa do projeto";
  if (source === "WORK_ITEMS") return "Demandas estimadas";
  return "Projetos e demandas estimados";
}

function formatComparableCoverage(
  comparableSeconds: number,
  totalSeconds: number,
) {
  if (comparableSeconds === totalSeconds) {
    return "Todo o tempo registrado possui estimativa associada.";
  }
  return `Somente ${formatDuration(comparableSeconds)} de ${formatDuration(totalSeconds)} registrados possuem estimativa associada.`;
}

function getDifferenceTone(comparison: InsightComparison | null) {
  if (!comparison || comparison.differenceSeconds === 0) {
    return "neutral" as const;
  }
  return comparison.differenceSeconds > 0
    ? ("negative" as const)
    : ("positive" as const);
}
