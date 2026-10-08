"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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

const sortOptions: {
  label: string;
  sort: DemandSortKey;
  dir: DemandSortDir;
}[] = [
  { label: "Atualizado", sort: "updated", dir: "desc" },
  { label: "Mais antigo", sort: "updated", dir: "asc" },
  { label: "Demanda A–Z", sort: "title", dir: "asc" },
  { label: "Demanda Z–A", sort: "title", dir: "desc" },
  { label: "Projeto A–Z", sort: "project", dir: "asc" },
  { label: "Projeto Z–A", sort: "project", dir: "desc" },
  { label: "Mais tempo", sort: "tracked", dir: "desc" },
  { label: "Menos tempo", sort: "tracked", dir: "asc" },
  { label: "Maior estimativa", sort: "estimate", dir: "desc" },
  { label: "Menor estimativa", sort: "estimate", dir: "asc" },
];

const statusLabels: Record<DemandStatusFilter, string> = {
  ALL: "Todas",
  ACTIVE: "Ativas",
  DONE: "Concluídas",
};

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
  const searchRef = useRef<HTMLInputElement>(null);

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

  const selectedProject = projects.find((project) => project.id === projectId);
  const hasSearch = Boolean(query.trim());
  const hasProject = Boolean(projectId);
  const hasStatus = status !== "ALL";
  const hasSort =
    sort !== defaultDemandSort.sort || dir !== defaultDemandSort.dir;
  const hasFilters = hasSearch || hasProject || hasStatus || hasSort;
  const sortValue = `${sort}:${dir}`;

  function clearFilters() {
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
    searchRef.current?.focus();
  }

  return (
    <div className="demand-filters" aria-busy={pending}>
      <div className="demand-filters__toolbar">
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
            ref={searchRef}
            type="search"
            value={query}
          />
        </label>
        <label className="demand-toolbar-control">
          <span className="sr-only">Filtrar por projeto</span>
          <select
            aria-label="Filtrar por projeto"
            onChange={(event) => {
              setProjectId(event.target.value);
              updateRoute({ projectId: event.target.value });
            }}
            value={projectId}
          >
            <option value="">Projeto</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <label className="demand-toolbar-control">
          <span className="sr-only">Filtrar por status</span>
          <select
            aria-label="Filtrar por status"
            onChange={(event) => {
              const next = event.target.value as DemandStatusFilter;
              setStatus(next);
              updateRoute({ status: next });
            }}
            value={status}
          >
            <option value="ALL">Status</option>
            <option value="ACTIVE">{`Ativas (${counts.active})`}</option>
            <option value="DONE">{`Concluídas (${counts.done})`}</option>
          </select>
        </label>
        <label className="demand-toolbar-control demand-toolbar-control--sort">
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
            value={sortValue}
          >
            {sortOptions.map((option) => (
              <option
                key={`${option.sort}:${option.dir}`}
                value={`${option.sort}:${option.dir}`}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {hasFilters ? (
        <div className="demand-filter-chips">
          {hasSearch ? (
            <button
              className="demand-filter-chip"
              onClick={() => {
                setQuery("");
                updateRoute({ search: "" });
              }}
              type="button"
            >
              <span>{query.trim()}</span>
              <span aria-hidden="true">×</span>
              <span className="sr-only">Remover busca</span>
            </button>
          ) : null}
          {hasProject ? (
            <button
              className="demand-filter-chip"
              onClick={() => {
                setProjectId("");
                updateRoute({ projectId: "" });
              }}
              type="button"
            >
              <span>Projeto: {selectedProject?.name ?? "selecionado"}</span>
              <span aria-hidden="true">×</span>
              <span className="sr-only">Remover filtro de projeto</span>
            </button>
          ) : null}
          {hasStatus ? (
            <button
              className="demand-filter-chip"
              onClick={() => {
                setStatus("ALL");
                updateRoute({ status: "ALL" });
              }}
              type="button"
            >
              <span>Status: {statusLabels[status]}</span>
              <span aria-hidden="true">×</span>
              <span className="sr-only">Remover filtro de status</span>
            </button>
          ) : null}
          <button
            className="demand-filters__clear"
            onClick={clearFilters}
            type="button"
          >
            Limpar filtros
          </button>
        </div>
      ) : null}
    </div>
  );
}
