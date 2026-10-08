import { describe, expect, it } from "vitest";

import {
  demandTreeParentIds,
  flattenDemandTree,
  flattenVisibleDemandTree,
  visibleDemandParentIds,
} from "./demand-tree";
import type { DemandListItem } from "./service";

function demand(
  id: string,
  parentWorkItemId: string | null = null,
  extra: Partial<DemandListItem> = {},
): DemandListItem {
  return {
    id,
    title: extra.title ?? id,
    description: null,
    source: "MANUAL",
    externalIdentifier: null,
    externalUrl: null,
    parentWorkItemId,
    status: extra.status ?? "TODO",
    isActive: true,
    estimatedMinutes: extra.estimatedMinutes ?? null,
    projectId: extra.projectId ?? "project-1",
    projectName: extra.projectName ?? "Project",
    projectSource: "MANUAL",
    projectStatus: "ACTIVE",
    workItemBreadcrumb: extra.workItemBreadcrumb ?? id,
    trackedSeconds: extra.trackedSeconds ?? 0,
    recordCount: 0,
    lastActivityAt: extra.lastActivityAt ?? null,
    isRunning: false,
    recentRecords: [],
  };
}

describe("demand tree", () => {
  it("flattens multiple hierarchy levels while preserving sibling order", () => {
    const demands = [
      demand("root"),
      demand("child", "root"),
      demand("grandchild", "child"),
      demand("sibling", "root"),
    ];

    const rows = flattenDemandTree(demands, new Set(["root", "child"]));

    expect(
      rows.map((row) => [
        row.id,
        row.depth,
        row.childCount,
        row.completedChildCount,
        row.hasChildren,
        row.treeLines,
      ]),
    ).toEqual([
      ["root", 0, 2, 0, true, []],
      ["child", 1, 1, 0, true, [true]],
      ["grandchild", 2, 0, 0, false, [true, false]],
      ["sibling", 1, 0, 0, false, [false]],
    ]);
  });

  it("counts completed direct children without rolling status up", () => {
    const completed = demand("done", "root", { status: "DONE" });

    const rows = flattenDemandTree(
      [demand("root"), completed, demand("todo", "root")],
      new Set(["root"]),
    );

    expect(rows[0]).toMatchObject({
      childCount: 2,
      completedChildCount: 1,
      id: "root",
    });
  });

  it("hides descendants when a parent is collapsed", () => {
    const rows = flattenDemandTree(
      [demand("root"), demand("child", "root")],
      new Set(),
    );

    expect(rows.map((row) => row.id)).toEqual(["root"]);
    expect(rows[0]).toMatchObject({ childCount: 1, hasChildren: true });
  });

  it("keeps filtered children visible as roots when their ancestor is absent", () => {
    const rows = flattenDemandTree(
      [demand("child", "missing-parent")],
      new Set(),
    );

    expect(rows[0]).toMatchObject({ depth: 0, id: "child", isMatch: true });
  });

  it("restores ancestors from the catalog when a deep child matches", () => {
    const root = demand("kyc", null, { title: "Implementar KYC" });
    const child = demand("sumsub", "kyc", { title: "Integração Sumsub" });
    const grandchild = demand("webhook", "sumsub", {
      title: "Implementar webhook",
    });

    const rows = flattenVisibleDemandTree({
      catalog: [root, child, grandchild, demand("other", "kyc")],
      expandedIds: new Set(["kyc", "sumsub"]),
      matches: [grandchild],
    });

    expect(
      rows.map((row) => [row.id, row.depth, row.isMatch, row.isContext]),
    ).toEqual([
      ["kyc", 0, false, true],
      ["sumsub", 1, false, true],
      ["webhook", 2, true, false],
    ]);
  });

  it("does not show unmatched siblings along a filtered path", () => {
    const rows = flattenVisibleDemandTree({
      catalog: [
        demand("root"),
        demand("kept", "root"),
        demand("hidden", "root"),
      ],
      expandedIds: new Set(["root"]),
      matches: [demand("kept", "root")],
    });

    expect(rows.map((row) => row.id)).toEqual(["root", "kept"]);
  });

  it("sorts siblings without separating parents from their descendants", () => {
    const parentB = demand("parent-b", null, {
      lastActivityAt: new Date("2026-01-02"),
      title: "Pai B",
    });
    const parentA = demand("parent-a", null, {
      lastActivityAt: new Date("2026-01-01"),
      title: "Pai A",
    });
    const childB = demand("child-b", "parent-b", { title: "Filho B" });
    const childA2 = demand("child-a2", "parent-a", { title: "Filho A2" });
    const childA1 = demand("child-a1", "parent-a", { title: "Filho A1" });

    const rows = flattenVisibleDemandTree({
      dir: "asc",
      expandedIds: new Set(["parent-a", "parent-b"]),
      matches: [childB, parentB, parentA, childA2, childA1],
      sort: "title",
    });

    expect(rows.map((row) => row.id)).toEqual([
      "parent-a",
      "child-a1",
      "child-a2",
      "parent-b",
      "child-b",
    ]);
  });

  it("counts catalog children even when some are hidden by the current match set", () => {
    const rows = flattenVisibleDemandTree({
      catalog: [
        demand("root"),
        demand("done", "root", { status: "DONE" }),
        demand("todo", "root"),
      ],
      expandedIds: new Set(["root"]),
      matches: [demand("todo", "root")],
    });

    expect(rows[0]).toMatchObject({
      childCount: 2,
      completedChildCount: 1,
      id: "root",
      isContext: true,
    });
  });

  it("treats self-parented demands as roots", () => {
    const rows = flattenDemandTree([demand("loop", "loop")], new Set());
    expect(rows).toEqual([
      expect.objectContaining({ depth: 0, id: "loop", treeLines: [] }),
    ]);
  });

  it("does not loop when two demands parent each other", () => {
    const rows = flattenDemandTree(
      [demand("alpha", "beta"), demand("beta", "alpha")],
      new Set(["alpha", "beta"]),
    );

    expect(rows.map((row) => row.id).sort()).toEqual(["alpha", "beta"]);
    expect(rows.every((row) => row.depth === 0)).toBe(true);
  });

  it("identifies only parents that are present in the current result", () => {
    expect(
      demandTreeParentIds([
        demand("root"),
        demand("child", "root"),
        demand("orphan", "missing-parent"),
      ]),
    ).toEqual(new Set(["root"]));
  });

  it("identifies context parents restored from the catalog", () => {
    expect(
      visibleDemandParentIds(
        [demand("grandchild", "child")],
        [
          demand("root"),
          demand("child", "root"),
          demand("grandchild", "child"),
        ],
      ),
    ).toEqual(new Set(["root", "child"]));
  });
});
