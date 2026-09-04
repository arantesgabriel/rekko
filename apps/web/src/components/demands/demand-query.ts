import {
  defaultDemandSort,
  type DemandSortDir,
  type DemandSortKey,
} from "@/modules/projects/demand-sort";

export type DemandStatusFilter = "ALL" | "ACTIVE" | "DONE";

export type DemandListQuery = {
  projectId: string;
  search: string;
  status: DemandStatusFilter;
  sort: DemandSortKey;
  dir: DemandSortDir;
};

export function demandSearchString(query: DemandListQuery) {
  const params = new URLSearchParams();
  if (query.search.trim()) params.set("q", query.search.trim());
  if (query.status !== "ALL") params.set("status", query.status);
  if (query.projectId) params.set("projectId", query.projectId);
  if (query.sort !== defaultDemandSort.sort) params.set("sort", query.sort);
  if (
    query.sort !== defaultDemandSort.sort ||
    query.dir !== defaultDemandSort.dir
  ) {
    params.set("dir", query.dir);
  }
  const search = params.toString();
  return search ? `?${search}` : "";
}
