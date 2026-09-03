"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import {
  formatReportDisplayDate,
  formatReportDisplayDateTime,
  formatReportDuration,
  formatReportInputTime,
  formatReportShortDisplayDate,
} from "@/modules/reports/domain";
import type { ReportFilterOptions, ReportRow } from "@/modules/reports/service";
import type { ReportQuery } from "@/modules/reports/schemas";
import { ExportCsvButton } from "./export-csv-button";
import { TimeEntryActions } from "./time-entry-actions";

type ReportData = {
  timezone: string;
  period: ReportQuery;
  rows: ReportRow[];
  totalRows: number;
  totalSeconds: number;
  page: number;
  pageCount: number;
};

export function ReportsView({
  data,
  options,
  exportUrl,
  workspaceSlug,
}: {
  data: ReportData;
  options: ReportFilterOptions;
  exportUrl: string;
  workspaceSlug: string;
}) {
  return (
    <div className="reports-page">
      <section className="reports-toolbar" aria-label="Filtros do relatório">
        <div>
          <p className="reports-toolbar__timezone">
            Horários em {data.timezone}
          </p>
        </div>
        <div className="reports-toolbar__actions">
          <ExportCsvButton href={exportUrl} />
        </div>
      </section>

      <ReportFilters
        canViewWorkspace={options.canViewWorkspace}
        projects={options.projects}
        people={options.people}
        query={data.period}
        workItems={options.workItems}
      />

      <section className="reports-summary" aria-label="Resumo do relatório">
        <div>
          <span>Tempo filtrado</span>
          <strong>{formatHumanDuration(data.totalSeconds)}</strong>
        </div>
        <div>
          <span>Segmentos</span>
          <strong>{data.totalRows}</strong>
        </div>
      </section>

      {data.rows.length ? (
        <>
          <ReportTable
            canCorrectTime={options.canCorrectTime}
            currentUserId={options.currentUserId}
            data={data}
            projects={options.projects}
            timezone={data.timezone}
            workItems={options.workItems}
            workspaceSlug={workspaceSlug}
          />
          <ReportMobileList
            canCorrectTime={options.canCorrectTime}
            currentUserId={options.currentUserId}
            data={data}
            projects={options.projects}
            timezone={data.timezone}
            workItems={options.workItems}
            workspaceSlug={workspaceSlug}
          />
          <ReportPagination
            data={data}
            workspaceSlug={workspaceSlug}
            canViewWorkspace={options.canViewWorkspace}
          />
        </>
      ) : (
        <EmptyState
          description="Ajuste o período ou os filtros para encontrar os lançamentos de tempo do Workspace."
          title="Nenhum tempo encontrado."
        />
      )}
    </div>
  );
}

function ReportFilters({
  canViewWorkspace,
  people,
  projects,
  query,
  workItems,
}: {
  canViewWorkspace: boolean;
  people: ReportFilterOptions["people"];
  projects: ReportFilterOptions["projects"];
  query: ReportQuery;
  workItems: ReportFilterOptions["workItems"];
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [period, setPeriod] = useState<ReportQuery["period"]>(query.period);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const syncDisclosure = () => setFiltersOpen(media.matches);

    syncDisclosure();
    media.addEventListener("change", syncDisclosure);
    return () => media.removeEventListener("change", syncDisclosure);
  }, []);

  return (
    <details
      className="reports-filter-disclosure"
      onToggle={(event) => setFiltersOpen(event.currentTarget.open)}
      open={filtersOpen}
    >
      <summary>
        <span>
          <strong>Filtros</strong>
          <small>{getReportPeriodLabel(period)}</small>
        </span>
        <span className="button button--secondary button--sm">Abrir</span>
      </summary>
      <form className="reports-filters" method="get">
        <ReportFilterFields
          canViewWorkspace={canViewWorkspace}
          people={people}
          period={period}
          projects={projects}
          query={query}
          setPeriod={setPeriod}
          workItems={workItems}
        />
      </form>
    </details>
  );
}

function ReportFilterFields({
  canViewWorkspace,
  people,
  period,
  projects,
  query,
  setPeriod,
  workItems,
}: {
  canViewWorkspace: boolean;
  people: ReportFilterOptions["people"];
  period: ReportQuery["period"];
  projects: ReportFilterOptions["projects"];
  query: ReportQuery;
  setPeriod: (period: ReportQuery["period"]) => void;
  workItems: ReportFilterOptions["workItems"];
}) {
  return (
    <>
      <label>
        <span>Período</span>
        <select
          value={period}
          name="period"
          onChange={(event) =>
            setPeriod(event.currentTarget.value as ReportQuery["period"])
          }
        >
          <option value="today">Hoje</option>
          <option value="this_week">Esta semana</option>
          <option value="last_week">Semana passada</option>
          <option value="this_month">Este mês</option>
          <option value="custom">Personalizado</option>
        </select>
      </label>
      {period === "custom" ? (
        <>
          <label>
            <span>De</span>
            <input
              defaultValue={query.start}
              name="start"
              required
              type="date"
            />
          </label>
          <label>
            <span>Até</span>
            <input defaultValue={query.end} name="end" required type="date" />
          </label>
        </>
      ) : null}
      {canViewWorkspace ? (
        <label>
          <span>Colaborador</span>
          <select defaultValue={query.userId ?? "all"} name="userId">
            <option value="all">Todos os colaboradores</option>
            {people.map((person) => (
              <option key={person.userId} value={person.userId}>
                {person.name}
                {!person.currentMember ? " · histórico" : ""}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label>
        <span>Projeto</span>
        <select defaultValue={query.projectId ?? "all"} name="projectId">
          <option value="all">Todos os projetos</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
              {project.archivedAt ? " · arquivado" : ""}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Demanda</span>
        <select defaultValue={query.workItemId ?? "all"} name="workItemId">
          <option value="all">Todas as demandas</option>
          {workItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.externalIdentifier ? `${item.externalIdentifier} · ` : ""}
              {item.title}
              {item.archivedAt || item.status === "DONE" ? " · histórico" : ""}
            </option>
          ))}
        </select>
      </label>
      <button className="button button--secondary" type="submit">
        Aplicar filtros
      </button>
    </>
  );
}

function getReportPeriodLabel(period: ReportQuery["period"]) {
  if (period === "today") return "Hoje";
  if (period === "this_week") return "Esta semana";
  if (period === "last_week") return "Semana passada";
  if (period === "this_month") return "Este mês";
  return "Período personalizado";
}

function ReportTable({
  canCorrectTime,
  currentUserId,
  data,
  projects,
  timezone,
  workItems,
  workspaceSlug,
}: {
  canCorrectTime: boolean;
  currentUserId: string;
  data: ReportData;
  projects: ReportFilterOptions["projects"];
  timezone: string;
  workItems: ReportFilterOptions["workItems"];
  workspaceSlug: string;
}) {
  return (
    <div className="reports-table-wrap">
      <table className="reports-table">
        <caption>Horas registradas por segmento de trabalho</caption>
        <thead>
          <tr>
            <th scope="col">Data</th>
            <th scope="col">Colaborador</th>
            <th scope="col">Projeto</th>
            <th scope="col">Demanda</th>
            <th scope="col">Início</th>
            <th scope="col">Fim</th>
            <th scope="col">Duração</th>
            <th scope="col">Origem</th>
            {canCorrectTime ? <th scope="col">Ações</th> : null}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.segmentId}>
              <td data-label="Data">
                {formatReportDisplayDate(row.startedAt, data.timezone)}
              </td>
              <td data-label="Colaborador">
                <strong>{row.collaboratorName}</strong>
                <small>{row.email}</small>
              </td>
              <td data-label="Projeto">{row.projectName}</td>
              <td data-label="Demanda">
                {row.workItemTitle ?? "Sem demanda"}
                {row.description ? <small>{row.description}</small> : null}
              </td>
              <td data-label="Início">
                {formatReportDisplayDateTime(row.startedAt, data.timezone)}
              </td>
              <td data-label="Fim">
                {formatReportDisplayDateTime(row.endedAt, data.timezone)}
              </td>
              <td data-label="Duração">
                {formatReportDuration(row.durationSeconds)}
              </td>
              <td data-label="Origem">
                {row.source === "TIMER" ? "Timer" : "Manual"}
              </td>
              {canCorrectTime ? (
                <td data-label="Ações">
                  <TimeEntryActions
                    key={timeEntryActionKey(row)}
                    projects={projects}
                    row={row}
                    currentUserId={currentUserId}
                    timezone={timezone}
                    workItems={workItems}
                    workspaceSlug={workspaceSlug}
                  />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportMobileList({
  canCorrectTime,
  currentUserId,
  data,
  projects,
  timezone,
  workItems,
  workspaceSlug,
}: {
  canCorrectTime: boolean;
  currentUserId: string;
  data: ReportData;
  projects: ReportFilterOptions["projects"];
  timezone: string;
  workItems: ReportFilterOptions["workItems"];
  workspaceSlug: string;
}) {
  return (
    <ul className="reports-mobile-list" aria-label="Horas registradas">
      {data.rows.map((row) => (
        <li key={row.segmentId}>
          <details className="reports-mobile-list__details">
            <summary>
              <span className="reports-mobile-list__topline">
                <strong>
                  {formatReportShortDisplayDate(row.startedAt, data.timezone)}
                </strong>
                <b>{formatReportDuration(row.durationSeconds)}</b>
              </span>
              <span className="reports-mobile-list__project">
                {row.projectName}
              </span>
              <span className="reports-mobile-list__item">
                {row.workItemTitle ?? "Sem demanda"}
              </span>
            </summary>
            <div className="reports-mobile-list__expanded">
              <div className="reports-mobile-list__person">
                <strong>{row.collaboratorName}</strong>
                <span>{row.email}</span>
              </div>
              <small>
                {formatReportInputTime(row.startedAt, data.timezone)}–
                {formatReportInputTime(row.endedAt, data.timezone)} ·{" "}
                {row.source === "TIMER" ? "Timer" : "Manual"}
              </small>
              {row.description ? <small>{row.description}</small> : null}
              {canCorrectTime ? (
                <TimeEntryActions
                  key={timeEntryActionKey(row)}
                  projects={projects}
                  row={row}
                  currentUserId={currentUserId}
                  timezone={timezone}
                  workItems={workItems}
                  workspaceSlug={workspaceSlug}
                />
              ) : null}
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}

function timeEntryActionKey(row: ReportRow) {
  return [
    row.entryId,
    row.entryStartedAt.getTime(),
    row.entryFinishedAt?.getTime() ?? "open",
    row.projectId,
    row.workItemId ?? "none",
    row.description ?? "",
  ].join(":");
}

function ReportPagination({
  canViewWorkspace,
  data,
  workspaceSlug,
}: {
  canViewWorkspace: boolean;
  data: ReportData;
  workspaceSlug: string;
}) {
  if (data.pageCount <= 1) return null;
  const previous = data.page > 1 ? data.page - 1 : null;
  const next = data.page < data.pageCount ? data.page + 1 : null;
  return (
    <nav className="reports-pagination" aria-label="Paginação do relatório">
      {previous ? (
        <Link
          className="button button--secondary"
          href={`/w/${workspaceSlug}/reports?${queryString(data.period, previous, canViewWorkspace)}`}
        >
          ← Anterior
        </Link>
      ) : (
        <span />
      )}
      <span>
        Página {data.page} de {data.pageCount}
      </span>
      {next ? (
        <Link
          className="button button--secondary"
          href={`/w/${workspaceSlug}/reports?${queryString(data.period, next, canViewWorkspace)}`}
        >
          Próxima →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

function queryString(query: ReportQuery, page: number, includeUser: boolean) {
  const params = new URLSearchParams({
    period: query.period,
    page: String(page),
  });
  if (includeUser && query.userId) params.set("userId", query.userId);
  if (query.projectId) params.set("projectId", query.projectId);
  if (query.workItemId) params.set("workItemId", query.workItemId);
  if (query.period === "custom") {
    if (query.start) params.set("start", query.start);
    if (query.end) params.set("end", query.end);
  }
  return params.toString();
}

function formatHumanDuration(totalSeconds: number) {
  const minutes = Math.floor(Math.max(totalSeconds, 0) / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return (
    [hours ? `${hours}h` : "", rest ? `${rest}m` : ""]
      .filter(Boolean)
      .join(" ") || "0m"
  );
}
