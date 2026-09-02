"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { formatEstimate } from "@/modules/projects/domain";
import type {
  InsightComparison,
  InsightDay,
  InsightProject,
  InsightWorkItem,
} from "@/modules/insights/domain";
import type { InsightsResult } from "@/modules/insights/service";

export function InsightsView({ data }: { data: InsightsResult }) {
  const { aggregation } = data;
  const periodLabel = getPeriodLabel(
    data.period.period,
    data.period.start,
    data.period.end,
  );
  const hasTracked = aggregation.trackedSeconds > 0;
  const highlights = hasTracked ? buildHighlights(aggregation) : [];

  return (
    <div className="insights-page">
      <header className="insights-header">
        <div className="insights-header__copy">
          <p className="insights-header__context">{periodLabel}</p>
          <h1 className="page-title">Insights</h1>
          <p className="insights-header__description">
            Entenda como seu tempo foi distribuído e compare o realizado com o
            planejado.
          </p>
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
      </header>

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
          description="Você ainda não possui registros neste período. Comece uma atividade ou reconstrua um período na Timeline."
          title="Nenhum tempo registrado neste período."
        />
      ) : (
        <div className="insights-dashboard" aria-label="Resumo de insights">
          <section className="insights-kpis" aria-label="Resumo do período">
            <MetricCard
              label="Tempo registrado"
              note="Todo o tempo com registro"
              seconds={aggregation.trackedSeconds}
            />
            <MetricCard
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
            <MetricCard
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
            <MetricCard
              label="Projetos trabalhados"
              note="No período selecionado"
              seconds={aggregation.projects.length}
              value={String(aggregation.projects.length)}
              valueFormatter={(value) => String(Math.round(value))}
            />
          </section>

          <div className="insights-primary-grid">
            <TimeTrendChart
              comparison={aggregation.comparison}
              days={aggregation.days}
            />
            {highlights.length ? (
              <InsightHighlights items={highlights} />
            ) : null}
          </div>

          <div className="insights-distribution-grid">
            <ProjectDistribution
              projects={aggregation.projects}
              totalSeconds={aggregation.trackedSeconds}
            />
            <DemandDistribution
              items={aggregation.workItems}
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
      <button className="button button--secondary button--sm" type="submit">
        Aplicar filtros
      </button>
    </>
  );
}

function MetricCard({
  label,
  note,
  seconds,
  tone,
  value,
  valueFormatter,
}: {
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
    <article className={`insights-kpi${tone ? ` is-${tone}` : ""}`}>
      <div className="insights-kpi__label">
        <span>{label}</span>
        <span className="insights-kpi__mark" aria-hidden="true" />
      </div>
      <strong>{displayValue}</strong>
      <p>{note}</p>
    </article>
  );
}

function TimeTrendChart({
  comparison,
  days,
}: {
  comparison: InsightComparison | null;
  days: InsightDay[];
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const maxSeconds = getNiceChartMax(days);
  const registeredDays = days.filter((day) => day.trackedSeconds > 0).length;

  return (
    <section
      className="insights-card insights-trend"
      aria-labelledby="trend-title"
    >
      <div className="insights-card__header">
        <div>
          <h2 className="card-title" id="trend-title">
            Tempo ao longo do período
          </h2>
          <p>
            {registeredDays} de {days.length} dias com tempo registrado
          </p>
        </div>
        <div className="insights-legend" aria-label="Legenda do gráfico">
          <span>
            <i className="insights-legend__dot is-violet" /> Registrado
          </span>
          {comparison ? (
            <span className="insights-legend__note">
              Estimativa consolidada no período
            </span>
          ) : null}
        </div>
      </div>

      <div className="insights-trend__chart" aria-labelledby="trend-title">
        <div className="insights-trend__axis" aria-hidden="true">
          <span>{formatAxisDuration(maxSeconds)}</span>
          <span>{formatAxisDuration(maxSeconds / 2)}</span>
          <span>0m</span>
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
            const ratio = day.trackedSeconds / maxSeconds;
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
                  <span className="insights-trend__bar" aria-hidden="true" />
                  {isActive ? (
                    <TrendTooltip
                      comparison={comparison}
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
      <p className="insights-trend__hint">
        Passe o cursor ou toque em uma barra para ver o detalhe do dia.
      </p>
    </section>
  );
}

function TrendTooltip({
  comparison,
  day,
  edge,
}: {
  comparison: InsightComparison | null;
  day: InsightDay;
  edge: "first" | "last" | "middle";
}) {
  return (
    <div className={`insights-chart-tooltip is-${edge}`} role="status">
      <strong>{formatDateLabel(day.date)}</strong>
      <dl>
        <div>
          <dt>Registrado</dt>
          <dd>{formatDuration(day.trackedSeconds)}</dd>
        </div>
        {comparison ? (
          <div>
            <dt>Estimado no período</dt>
            <dd>{formatEstimate(comparison.estimatedMinutes)}</dd>
          </div>
        ) : null}
      </dl>
      {comparison ? (
        <small>
          Comparação consolidada:{" "}
          {formatDifference(comparison.differenceSeconds)}
        </small>
      ) : null}
    </div>
  );
}

function InsightHighlights({ items }: { items: string[] }) {
  return (
    <section
      className="insights-card insights-highlights"
      aria-labelledby="highlights-title"
    >
      <div className="insights-card__header">
        <div>
          <h2 className="card-title" id="highlights-title">
            Destaques
          </h2>
          <p>Leituras rápidas do período selecionado</p>
        </div>
        <span className="insights-highlights__pulse" aria-hidden="true" />
      </div>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <span className="insights-highlights__bullet" aria-hidden="true" />
            <p>{item}</p>
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
      className="insights-card insights-distribution"
      aria-labelledby="projects-title"
    >
      <div className="insights-card__header">
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
        <span className="insights-card__total">
          {formatDuration(totalSeconds)}
        </span>
      </div>
      <RankingList
        ariaLabel="Tempo registrado por projeto"
        items={projects.map((project) => ({
          id: project.projectId,
          label: project.projectName,
          detail: project.estimatedMinutes
            ? `Estimativa ${formatEstimate(project.estimatedMinutes)}`
            : "Sem estimativa do projeto",
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
      className="insights-card insights-distribution"
      aria-labelledby="demands-title"
    >
      <div className="insights-card__header">
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
        <span className="insights-card__total">
          Top {Math.min(items.length, 5)}
        </span>
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
  items,
  totalSeconds,
}: {
  ariaLabel: string;
  items: Array<{
    id: string;
    label: string;
    detail: string;
    seconds: number;
  }>;
  totalSeconds: number;
}) {
  return (
    <ul className="insights-ranking" aria-label={ariaLabel}>
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
      className="insights-card insights-comparison"
      aria-labelledby="comparison-title"
    >
      <div className="insights-card__header">
        <div>
          <h2 className="card-title" id="comparison-title">
            Planejado vs realizado
          </h2>
          <p>
            Uma leitura neutra da diferença entre estimativa e tempo registrado
          </p>
        </div>
        {comparison ? (
          <span
            className={`insights-difference ${getDifferenceTone(comparison)}`}
          >
            {formatDifference(comparison.differenceSeconds)}
          </span>
        ) : null}
      </div>

      {comparison ? (
        <>
          <div className="insights-comparison__context">
            <strong>{getComparisonSourceLabel(comparison.source)}</strong>
            <span>
              {formatComparableCoverage(
                comparison.trackedSeconds,
                totalSeconds,
              )}
            </span>
          </div>
          <div
            className="insights-comparison__summary"
            aria-label="Resumo do comparativo"
          >
            <ComparisonStat
              label="Estimado"
              value={formatEstimate(comparison.estimatedMinutes)}
            />
            <ComparisonStat
              label="Registrado comparável"
              value={formatDuration(comparison.trackedSeconds)}
            />
            <ComparisonStat
              label="Diferença"
              tone={getDifferenceTone(comparison)}
              value={formatDifference(comparison.differenceSeconds)}
            />
          </div>
          <div className="insights-comparison__legend" aria-hidden="true">
            <span>
              <i className="is-violet" /> Estimado
            </span>
            <span>
              <i className="is-blue" /> Registrado
            </span>
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
}: {
  comparison: InsightComparison;
  detail: string;
  label: string;
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
        <span
          className={`insights-difference ${getDifferenceTone(comparison)}`}
        >
          {formatDifference(comparison.differenceSeconds)}
        </span>
      </div>
      <div className="insights-comparison-row__bars">
        <ComparisonBar
          label="Estimado"
          seconds={estimatedSeconds}
          tone="violet"
          ratio={estimatedSeconds / maxSeconds}
        />
        <ComparisonBar
          label="Registrado"
          seconds={comparison.trackedSeconds}
          tone="blue"
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
  tone: "blue" | "violet";
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

function buildHighlights(aggregation: InsightsResult["aggregation"]) {
  const highlights: string[] = [];
  const comparison = aggregation.comparison;

  if (comparison) {
    if (comparison.differenceSeconds > 0) {
      highlights.push(
        `Você registrou ${formatDuration(comparison.differenceSeconds)} acima do estimado nas demandas comparáveis.`,
      );
    } else if (comparison.differenceSeconds < 0) {
      highlights.push(
        `Você registrou ${formatDuration(Math.abs(comparison.differenceSeconds))} abaixo do estimado nas demandas comparáveis.`,
      );
    } else {
      highlights.push(
        "O tempo registrado nas demandas comparáveis ficou alinhado ao estimado.",
      );
    }
  }

  const topProject = aggregation.projects[0];
  if (topProject && aggregation.projects.length > 1) {
    const percentage = Math.round(
      (topProject.trackedSeconds / aggregation.trackedSeconds) * 100,
    );
    highlights.push(
      `${percentage}% do seu tempo ficou concentrado no projeto ${topProject.projectName}.`,
    );
  }

  const busiestDay = aggregation.days.reduce<InsightDay | null>(
    (current, day) =>
      !current || day.trackedSeconds > current.trackedSeconds ? day : current,
    null,
  );
  if (busiestDay && busiestDay.trackedSeconds > 0) {
    highlights.push(
      `${formatDateLabel(busiestDay.date)} foi o dia com maior volume: ${formatDuration(busiestDay.trackedSeconds)}.`,
    );
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
    const duration = 520;
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

function getNiceChartMax(days: InsightDay[]) {
  const max = Math.max(...days.map((day) => day.trackedSeconds), 1);
  const hour = 60 * 60;
  return Math.max(hour, Math.ceil(max / hour) * hour);
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

function formatAxisDuration(seconds: number) {
  const hours = Math.round(seconds / 60 / 60);
  return hours ? `${hours}h` : `${Math.round(seconds / 60)}m`;
}

function formatDifference(seconds: number) {
  if (seconds === 0) return "0m";
  return `${seconds > 0 ? "+" : "−"}${formatDuration(Math.abs(seconds))}`;
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
