export const demandSortKeys = [
  "title",
  "project",
  "tracked",
  "estimate",
  "updated",
] as const;

export type DemandSortKey = (typeof demandSortKeys)[number];
export type DemandSortDir = "asc" | "desc";

export const defaultDemandSort = {
  sort: "updated",
  dir: "desc",
} as const satisfies { sort: DemandSortKey; dir: DemandSortDir };

export function parseDemandSort(
  sort: unknown,
  dir: unknown,
): { sort: DemandSortKey; dir: DemandSortDir } {
  const nextSort = demandSortKeys.includes(sort as DemandSortKey)
    ? (sort as DemandSortKey)
    : defaultDemandSort.sort;
  const nextDir = dir === "asc" || dir === "desc" ? dir : defaultDemandSort.dir;
  return { sort: nextSort, dir: nextDir };
}

export function compareDemands<
  T extends {
    title: string;
    externalIdentifier: string | null;
    projectName: string;
    trackedSeconds: number;
    estimatedMinutes: number | null;
    lastActivityAt: Date | null;
  },
>(left: T, right: T, sort: DemandSortKey, dir: DemandSortDir) {
  const order = dir === "asc" ? 1 : -1;
  const collator = new Intl.Collator("pt", { sensitivity: "base" });
  switch (sort) {
    case "title":
      return order * collator.compare(left.title, right.title);
    case "project":
      return order * collator.compare(left.projectName, right.projectName);
    case "tracked":
      return order * (left.trackedSeconds - right.trackedSeconds);
    case "estimate":
      return (
        order * ((left.estimatedMinutes ?? 0) - (right.estimatedMinutes ?? 0))
      );
    case "updated":
      return (
        order *
        ((left.lastActivityAt?.getTime() ?? 0) -
          (right.lastActivityAt?.getTime() ?? 0))
      );
  }
}

export function sortDemands<
  T extends {
    title: string;
    externalIdentifier: string | null;
    projectName: string;
    trackedSeconds: number;
    estimatedMinutes: number | null;
    lastActivityAt: Date | null;
  },
>(demands: T[], sort: DemandSortKey, dir: DemandSortDir) {
  return [...demands].sort((left, right) =>
    compareDemands(left, right, sort, dir),
  );
}
