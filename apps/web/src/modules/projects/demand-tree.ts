import {
  compareDemands,
  type DemandSortDir,
  type DemandSortKey,
} from "./demand-sort";
import type { DemandListItem } from "./service";

export type DemandTreeItem = DemandListItem & {
  childCount: number;
  completedChildCount: number;
  depth: number;
  hasChildren: boolean;
  isContext: boolean;
  isExpanded: boolean;
  isMatch: boolean;
  /** One flag per ancestor indent: `true` continues the vertical guide. */
  treeLines: boolean[];
};

type DemandForest = {
  byId: Map<string, DemandListItem>;
  childCounts: Map<string, number>;
  childrenByParent: Map<string, DemandListItem[]>;
  completedChildCounts: Map<string, number>;
  matchIds: Set<string>;
  roots: DemandListItem[];
};

function indexDemands(
  matches: readonly DemandListItem[],
  catalog: readonly DemandListItem[],
) {
  const byId = new Map<string, DemandListItem>();
  for (const demand of catalog) {
    if (!byId.has(demand.id)) byId.set(demand.id, demand);
  }
  for (const demand of matches) {
    byId.set(demand.id, demand);
  }
  return byId;
}

function resolvedParentId(
  demand: DemandListItem,
  byId: ReadonlyMap<string, DemandListItem>,
) {
  const parentId = demand.parentWorkItemId;
  if (!parentId || parentId === demand.id || !byId.has(parentId)) return null;
  let cursor: string | null = parentId;
  const seen = new Set<string>([demand.id]);
  while (cursor) {
    if (seen.has(cursor)) return null;
    seen.add(cursor);
    const parent = byId.get(cursor);
    if (!parent) return parentId;
    const next = parent.parentWorkItemId;
    if (!next || next === parent.id || !byId.has(next)) break;
    cursor = next;
  }
  return parentId;
}

function collectVisibleIds(
  matches: readonly DemandListItem[],
  byId: ReadonlyMap<string, DemandListItem>,
) {
  const visible = new Set<string>();
  for (const match of matches) {
    let cursor: string | null = match.id;
    const seen = new Set<string>();
    while (cursor && !seen.has(cursor)) {
      seen.add(cursor);
      visible.add(cursor);
      const node = byId.get(cursor);
      if (!node) break;
      cursor = resolvedParentId(node, byId);
    }
  }
  return visible;
}

function compareSiblings(
  left: DemandListItem,
  right: DemandListItem,
  sort?: DemandSortKey,
  dir?: DemandSortDir,
) {
  if (!sort || !dir) return 0;
  const ranked = compareDemands(left, right, sort, dir);
  return ranked !== 0 ? ranked : left.id.localeCompare(right.id);
}

function prepareDemandForest(
  matches: readonly DemandListItem[],
  catalog: readonly DemandListItem[] = matches,
  sort?: DemandSortKey,
  dir?: DemandSortDir,
): DemandForest {
  const byId = indexDemands(matches, catalog);
  const matchIds = new Set(matches.map((demand) => demand.id));
  const visibleIds = collectVisibleIds(matches, byId);
  const childCounts = new Map<string, number>();
  const completedChildCounts = new Map<string, number>();
  const childrenByParent = new Map<string, DemandListItem[]>();

  for (const demand of byId.values()) {
    const parentId = resolvedParentId(demand, byId);
    if (!parentId) continue;
    childCounts.set(parentId, (childCounts.get(parentId) ?? 0) + 1);
    if (demand.status === "DONE") {
      completedChildCounts.set(
        parentId,
        (completedChildCounts.get(parentId) ?? 0) + 1,
      );
    }
  }

  const ordered: DemandListItem[] = [];
  const seen = new Set<string>();
  for (const demand of [...matches, ...catalog, ...byId.values()]) {
    if (!visibleIds.has(demand.id) || seen.has(demand.id)) continue;
    seen.add(demand.id);
    ordered.push(byId.get(demand.id) ?? demand);
  }

  for (const demand of ordered) {
    const parentId = resolvedParentId(demand, byId);
    if (!parentId || !visibleIds.has(parentId)) continue;
    const children = childrenByParent.get(parentId) ?? [];
    children.push(demand);
    childrenByParent.set(parentId, children);
  }

  if (sort && dir) {
    for (const children of childrenByParent.values()) {
      children.sort((left, right) => compareSiblings(left, right, sort, dir));
    }
  }

  const roots = ordered.filter((demand) => {
    const parentId = resolvedParentId(demand, byId);
    return !parentId || !visibleIds.has(parentId);
  });
  if (sort && dir) {
    roots.sort((left, right) => compareSiblings(left, right, sort, dir));
  }

  return {
    byId,
    childCounts,
    childrenByParent,
    completedChildCounts,
    matchIds,
    roots,
  };
}

function flattenForest(
  forest: DemandForest,
  expandedIds: ReadonlySet<string>,
): DemandTreeItem[] {
  const visible: DemandTreeItem[] = [];
  const rendered = new Set<string>();

  function visit(
    demand: DemandListItem,
    depth: number,
    path: Set<string>,
    treeLines: boolean[],
  ) {
    if (rendered.has(demand.id) || path.has(demand.id)) return;
    rendered.add(demand.id);
    const children = forest.childrenByParent.get(demand.id) ?? [];
    const hasChildren = children.length > 0;
    const isExpanded = hasChildren && expandedIds.has(demand.id);
    visible.push({
      ...demand,
      childCount: forest.childCounts.get(demand.id) ?? 0,
      completedChildCount: forest.completedChildCounts.get(demand.id) ?? 0,
      depth,
      hasChildren,
      isContext: !forest.matchIds.has(demand.id),
      isExpanded,
      isMatch: forest.matchIds.has(demand.id),
      treeLines,
    });
    if (!isExpanded) return;

    const nextPath = new Set(path);
    nextPath.add(demand.id);
    children.forEach((child, index) => {
      visit(child, depth + 1, nextPath, [
        ...treeLines,
        index < children.length - 1,
      ]);
    });
  }

  for (const demand of forest.roots) {
    visit(demand, 0, new Set(), []);
  }

  for (const demand of forest.byId.values()) {
    if (rendered.has(demand.id) || !forest.matchIds.has(demand.id)) continue;
    let cursor = resolvedParentId(demand, forest.byId);
    const seen = new Set<string>();
    let hasRenderedAncestor = false;
    while (cursor && !seen.has(cursor)) {
      if (rendered.has(cursor)) {
        hasRenderedAncestor = true;
        break;
      }
      seen.add(cursor);
      const parent = forest.byId.get(cursor);
      cursor = parent ? resolvedParentId(parent, forest.byId) : null;
    }
    if (!hasRenderedAncestor) visit(demand, 0, new Set(), []);
  }

  return visible;
}

/**
 * Builds a recursive tree table from matching demands, restoring ancestors from
 * the catalog so search and filters never detach a child from its path.
 */
export function flattenVisibleDemandTree({
  catalog,
  dir,
  expandedIds,
  matches,
  sort,
}: {
  catalog?: readonly DemandListItem[];
  dir?: DemandSortDir;
  expandedIds: ReadonlySet<string>;
  matches: readonly DemandListItem[];
  sort?: DemandSortKey;
}): DemandTreeItem[] {
  return flattenForest(
    prepareDemandForest(matches, catalog, sort, dir),
    expandedIds,
  );
}

/**
 * Keeps the provided order while exposing a flat list suitable for the demand
 * grid. Missing ancestors are treated as roots when no catalog is given.
 */
export function flattenDemandTree(
  demands: DemandListItem[],
  expandedIds: ReadonlySet<string>,
): DemandTreeItem[] {
  return flattenVisibleDemandTree({ expandedIds, matches: demands });
}

export function visibleDemandParentIds(
  matches: readonly DemandListItem[],
  catalog?: readonly DemandListItem[],
) {
  const forest = prepareDemandForest(matches, catalog);
  return new Set(forest.childrenByParent.keys());
}

export function demandTreeParentIds(demands: DemandListItem[]) {
  return visibleDemandParentIds(demands);
}
