"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  demandSearchString,
  type DemandListQuery,
  type DemandStatusFilter,
} from "@/components/demands/demand-query";
import {
  defaultDemandSort,
  type DemandSortDir,
  type DemandSortKey,
} from "@/modules/projects/demand-sort";

const mobileSortOptions: {
  label: string;
  sort: DemandSortKey;
  dir: DemandSortDir;
}[] = [
  { label: "Atualizado: recente", sort: "updated", dir: "desc" },
  { label: "Atualizado: antigo", sort: "updated", dir: "asc" },
  { label: "Demanda: A–Z", sort: "title", dir: "asc" },
  { label: "Demanda: Z–A", sort: "title", dir: "desc" },
  { label: "Projeto: A–Z", sort: "project", dir: "asc" },
  { label: "Projeto: Z–A", sort: "project", dir: "desc" },
  { label: "Registrado: mais tempo", sort: "tracked", dir: "desc" },
  { label: "Registrado: menos tempo", sort: "tracked", dir: "asc" },
  { label: "Estimativa: maior", sort: "estimate", dir: "desc" },
  { label: "Estimativa: menor", sort: "estimate", dir: "asc" },
];

export function DemandFilters({
  counts,
  initialDir,
  initialProjectId,
  initialQuery,
  initialSort,
  initialStatus,
  projects,
}: {
  counts: { all: number; active: number; done: number };
  initialDir: DemandSortDir;
  initialProjectId: string;
  initialQuery: string;
  initialSort: DemandSortKey;
  initialStatus: DemandStatusFilter;
  projects: { id: string; name: string }[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<DemandStatusFilter>(initialStatus);
  const [projectId, setProjectId] = useState(initialProjectId);
  const [sort, setSort] = useState<DemandSortKey>(initialSort);
  const [dir, setDir] = useState<DemandSortDir>(initialDir);
  const [pending, startTransition] = useTransition();

  function currentQuery(next: Partial<DemandListQuery> = {}): DemandListQuery {
    return {
      search: next.search ?? query,
      status: next.status ?? status,
      projectId: next.projectId ?? projectId,
      sort: next.sort ?? sort,
      dir: next.dir ?? dir,
    };
  }

  function updateRoute(next: Partial<DemandListQuery> = {}) {
    startTransition(() =>
      router.replace(`${pathname}${demandSearchString(currentQuery(next))}`, {
        scroll: false,
      }),
    );
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (query !== initialQuery) updateRoute({ search: query });
    }, 320);
    return () => window.clearTimeout(timer);
    // The initial query is the server-confirmed value for this navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const hasFilters = Boolean(
    query ||
    projectId ||
    status !== "ALL" ||
    sort !== defaultDemandSort.sort ||
    dir !== defaultDemandSort.dir,
  );
  const mobileSortValue = `${sort}:${dir}`;
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
        <label className="demand-sort-filter">
          <span className="sr-only">Ordenar demandas</span>
          <select
            aria-label="Ordenar demandas"
            onChange={(event) => {
              const [nextSort, nextDir] = event.target.value.split(":") as [
                DemandSortKey,
                DemandSortDir,
              ];
              setSort(nextSort);
              setDir(nextDir);
              updateRoute({ sort: nextSort, dir: nextDir });
            }}
            value={mobileSortValue}
          >
            {mobileSortOptions.map((option) => (
              <option
                key={`${option.sort}:${option.dir}`}
                value={`${option.sort}:${option.dir}`}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="demand-project-filter">
          {hasFilters ? (
            <button
              aria-label="Limpar filtros"
              className="button button--ghost button--sm demand-filters__clear"
              onClick={() => {
                setQuery("");
                setStatus("ALL");
                setProjectId("");
                setSort(defaultDemandSort.sort);
                setDir(defaultDemandSort.dir);
                updateRoute({
                  search: "",
                  status: "ALL",
                  projectId: "",
                  sort: defaultDemandSort.sort,
                  dir: defaultDemandSort.dir,
                });
              }}
              type="button"
            >
              Limpar
            </button>
          ) : null}
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
      </div>
    </div>
  );
}
