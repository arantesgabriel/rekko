import { describe, expect, it } from "vitest";

import type { DemandListItem } from "./service";
import { demandTreeParentIds, flattenDemandTree } from "./demand-tree";

function demand(
  id: string,
  parentWorkItemId: string | null = null,
): DemandListItem {
  return {
    id,
    title: id,
    description: null,
    source: "MANUAL",
    externalIdentifier: null,
    externalUrl: null,
    parentWorkItemId,
    status: "TODO",
    isActive: true,
    estimatedMinutes: null,
    projectId: "project-1",
    projectName: "Project",
    projectSource: "MANUAL",
    projectStatus: "ACTIVE",
    workItemBreadcrumb: id,
    trackedSeconds: 0,
    recordCount: 0,
    lastActivityAt: null,
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
        row.level,
        row.childCount,
        row.completedChildCount,
        row.treeLines,
      ]),
    ).toEqual([
      ["root", 0, 2, 0, []],
      ["child", 1, 1, 0, [true]],
      ["grandchild", 2, 0, 0, [true, false]],
      ["sibling", 1, 0, 0, [false]],
    ]);
  });

  it("counts completed direct children without rolling status up", () => {
    const completed = demand("done", "root");
    completed.status = "DONE";

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
    expect(rows[0]?.childCount).toBe(1);
  });

  it("keeps filtered children visible as roots when their ancestor is absent", () => {
    const rows = flattenDemandTree(
      [demand("child", "missing-parent")],
      new Set(),
    );

    expect(rows[0]).toMatchObject({ id: "child", level: 0 });
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
});
