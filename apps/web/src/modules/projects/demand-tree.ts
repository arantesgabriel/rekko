import type { DemandListItem } from "./service";

export type DemandTreeItem = DemandListItem & {
  childCount: number;
  completedChildCount: number;
  level: number;
  /** One flag per indent: `true` continues the vertical rail, `false` ends it. */
  treeLines: boolean[];
};

/**
 * Keeps the server-provided order while exposing a flat list suitable for the
 * existing demand grid. Missing ancestors are treated as roots so search and
 * filters never make a matching demand disappear from the result.
 */
export function flattenDemandTree(
  demands: DemandListItem[],
  expandedIds: ReadonlySet<string>,
): DemandTreeItem[] {
  const byId = new Map(demands.map((demand) => [demand.id, demand]));
  const childrenByParent = new Map<string, DemandListItem[]>();
  const childCounts = new Map<string, number>();
  const completedChildCounts = new Map<string, number>();

  for (const demand of demands) {
    if (!demand.parentWorkItemId || !byId.has(demand.parentWorkItemId)) {
      continue;
    }
    const children = childrenByParent.get(demand.parentWorkItemId) ?? [];
    children.push(demand);
    childrenByParent.set(demand.parentWorkItemId, children);
    childCounts.set(demand.parentWorkItemId, children.length);
    if (demand.status === "DONE") {
      completedChildCounts.set(
        demand.parentWorkItemId,
        (completedChildCounts.get(demand.parentWorkItemId) ?? 0) + 1,
      );
    }
  }

  const visible: DemandTreeItem[] = [];
  const rendered = new Set<string>();

  function visit(
    demand: DemandListItem,
    level: number,
    path: Set<string>,
    treeLines: boolean[],
  ) {
    if (path.has(demand.id)) return;
    rendered.add(demand.id);
    visible.push({
      ...demand,
      childCount: childCounts.get(demand.id) ?? 0,
      completedChildCount: completedChildCounts.get(demand.id) ?? 0,
      level,
      treeLines,
    });
    if (!expandedIds.has(demand.id)) return;

    const nextPath = new Set(path);
    nextPath.add(demand.id);
    const children = childrenByParent.get(demand.id) ?? [];
    children.forEach((child, index) => {
      visit(child, level + 1, nextPath, [
        ...treeLines,
        index < children.length - 1,
      ]);
    });
  }

  for (const demand of demands) {
    if (!demand.parentWorkItemId || !byId.has(demand.parentWorkItemId)) {
      visit(demand, 0, new Set(), []);
    }
  }

  // A malformed legacy cycle should not make the whole list disappear, while
  // collapsed descendants remain intentionally absent from the flat result.
  for (const demand of demands) {
    if (rendered.has(demand.id)) continue;
    let cursor = demand.parentWorkItemId;
    const seen = new Set<string>();
    let hasRenderedAncestor = false;
    while (cursor && byId.has(cursor) && !seen.has(cursor)) {
      if (rendered.has(cursor)) {
        hasRenderedAncestor = true;
        break;
      }
      seen.add(cursor);
      cursor = byId.get(cursor)?.parentWorkItemId ?? null;
    }
    if (!hasRenderedAncestor) visit(demand, 0, new Set(), []);
  }

  return visible;
}

export function demandTreeParentIds(demands: DemandListItem[]) {
  const ids = new Set(demands.map((demand) => demand.id));
  return new Set(
    demands
      .filter(
        (demand) =>
          demand.parentWorkItemId !== null && ids.has(demand.parentWorkItemId),
      )
      .map((demand) => demand.parentWorkItemId as string),
  );
}
