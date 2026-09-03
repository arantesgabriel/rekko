"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

type StatusFilter = "ALL" | "ACTIVE" | "DONE";

export function DemandFilters({
  counts,
  initialProjectId,
  initialQuery,
  initialStatus,
  projects,
}: {
  counts: { all: number; active: number; done: number };
  initialProjectId: string;
  initialQuery: string;
  initialStatus: StatusFilter;
  projects: { id: string; name: string }[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<StatusFilter>(initialStatus);
  const [projectId, setProjectId] = useState(initialProjectId);
  const [pending, startTransition] = useTransition();

  function updateRoute(next: {
    query?: string;
    status?: StatusFilter;
    projectId?: string;
  }) {
    const params = new URLSearchParams();
    const nextQuery = next.query ?? query;
    const nextStatus = next.status ?? status;
    const nextProjectId = next.projectId ?? projectId;
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextStatus !== "ALL") params.set("status", nextStatus);
    if (nextProjectId) params.set("projectId", nextProjectId);
    const search = params.toString();
    startTransition(() =>
      router.replace(`${pathname}${search ? `?${search}` : ""}`, {
        scroll: false,
      }),
    );
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (query !== initialQuery) updateRoute({ query });
    }, 320);
    return () => window.clearTimeout(timer);
    // The initial query is the server-confirmed value for this navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const hasFilters = Boolean(query || projectId || status !== "ALL");
  return (
    <div className="demand-filters" aria-busy={pending}>
      <label className="demand-search">
        <span className="sr-only">Buscar demandas</span>
        <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
          <circle
            cx="8.5"
            cy="8.5"
            r="5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="m12.5 12.5 4 4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        </svg>
        <input
          aria-label="Buscar demandas"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar demandas…"
          type="search"
          value={query}
        />
      </label>
      <div className="demand-filters__controls">
        <div
          aria-label="Filtrar demandas por status"
          className="demand-status-tabs"
          role="tablist"
        >
          {(
            [
              ["ALL", "Todas", counts.all],
              ["ACTIVE", "Ativas", counts.active],
              ["DONE", "Concluídas", counts.done],
            ] as const
          ).map(([value, label, count]) => (
            <button
              aria-selected={status === value}
              className={status === value ? "is-selected" : undefined}
              key={value}
              onClick={() => {
                setStatus(value);
                updateRoute({ status: value });
              }}
              role="tab"
              type="button"
            >
              <span className="demand-status-tabs__label">{label}</span>
              <span className="demand-status-tabs__count">{count}</span>
            </button>
          ))}
        </div>
        <label className="demand-project-filter">
          <span aria-hidden="true" className="demand-project-filter__prefix">
            Projeto
          </span>
          <span className="sr-only">Filtrar por projeto</span>
          <select
            aria-label="Filtrar por projeto"
            onChange={(event) => {
              setProjectId(event.target.value);
              updateRoute({ projectId: event.target.value });
            }}
            value={projectId}
          >
            <option value="">Todos os projetos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        {hasFilters ? (
          <button
            aria-label="Limpar filtros"
            className="button button--ghost button--sm demand-filters__clear"
            onClick={() => {
              setQuery("");
              setStatus("ALL");
              setProjectId("");
              updateRoute({ query: "", status: "ALL", projectId: "" });
            }}
            type="button"
          >
            Limpar
          </button>
        ) : null}
      </div>
    </div>
  );
}
