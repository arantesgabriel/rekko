"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

type StatusFilter = "ALL" | "ACTIVE" | "DONE";

export function DemandFilters({
  initialProjectId,
  initialQuery,
  initialStatus,
  projects,
}: {
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
          placeholder="Buscar por nome, código ou projeto…"
          type="search"
          value={query}
        />
      </label>
      <div className="demand-filters__controls">
        <div
          className="demand-status-tabs"
          role="tablist"
          aria-label="Filtrar demandas por status"
        >
          {(
            [
              ["ALL", "Todas"],
              ["ACTIVE", "Ativas"],
              ["DONE", "Concluídas"],
            ] as const
          ).map(([value, label]) => (
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
              {label}
            </button>
          ))}
        </div>
        <label className="demand-project-filter">
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
            className="button button--ghost button--sm demand-filters__clear"
            onClick={() => {
              setQuery("");
              setStatus("ALL");
              setProjectId("");
              updateRoute({ query: "", status: "ALL", projectId: "" });
            }}
            type="button"
          >
            Limpar filtros
          </button>
        ) : null}
      </div>
    </div>
  );
}
