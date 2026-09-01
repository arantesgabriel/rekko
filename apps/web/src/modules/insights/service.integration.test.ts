import "../../../../../packages/db/src/root-environment";

import {
  auditLog,
  project,
  timeEntry,
  timeSegment,
  user,
  workspace,
  workspaceMember,
  workItem,
} from "@rekko/db";
import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { createProject, createWorkItem } from "@/modules/projects/service";
import { getInsights } from "./service";

const suffix = crypto.randomUUID().slice(0, 8);
const owner = `insights-owner-${suffix}`;
const other = `insights-other-${suffix}`;
const ids = {
  workspace: [] as string[],
  project: [] as string[],
  workItem: [] as string[],
  timeEntry: [] as string[],
};
let firstSlug = "";
let secondSlug = "";
let firstProjectId = "";
let estimatedItemId = "";

describe.sequential("insights with PostgreSQL", () => {
  beforeAll(async () => {
    await db.insert(user).values([
      {
        id: owner,
        name: "Insights Owner",
        email: `${owner}@rekko.test`,
        timezone: "UTC",
      },
      {
        id: other,
        name: "Insights Other",
        email: `${other}@rekko.test`,
        timezone: "UTC",
      },
    ]);
    const first = await db.transaction(async (tx) => {
      const created = await tx
        .insert(workspace)
        .values({
          name: `Insights A ${suffix}`,
          slug: `insights-a-${suffix}`,
          timezone: "UTC",
          createdByUserId: owner,
        })
        .returning({ id: workspace.id, slug: workspace.slug });
      await tx.insert(workspaceMember).values({
        workspaceId: created[0]!.id,
        userId: owner,
        role: "OWNER",
      });
      return created[0]!;
    });
    const second = await db.transaction(async (tx) => {
      const created = await tx
        .insert(workspace)
        .values({
          name: `Insights B ${suffix}`,
          slug: `insights-b-${suffix}`,
          timezone: "UTC",
          createdByUserId: other,
        })
        .returning({ id: workspace.id, slug: workspace.slug });
      await tx.insert(workspaceMember).values([
        { workspaceId: created[0]!.id, userId: other, role: "OWNER" },
        { workspaceId: created[0]!.id, userId: owner, role: "MEMBER" },
      ]);
      return created[0]!;
    });
    ids.workspace.push(first.id, second.id);
    firstSlug = first.slug;
    secondSlug = second.slug;

    const firstProject = await createProject({
      actorUserId: owner,
      slug: firstSlug,
      name: "Project A",
      description: null,
      status: "ACTIVE",
      estimatedMinutes: null,
    });
    firstProjectId = firstProject.id;
    ids.project.push(firstProject.id);
    const item = await createWorkItem({
      actorUserId: owner,
      slug: firstSlug,
      projectId: firstProject.id,
      title: "Estimated item",
      description: null,
      status: "TODO",
      estimatedMinutes: 60,
      parentWorkItemId: null,
    });
    estimatedItemId = item.id;
    ids.workItem.push(item.id);
    await addEntry({
      workspaceId: first.id,
      projectId: firstProject.id,
      workItemId: item.id,
      start: "2026-09-07T08:00:00Z",
      end: "2026-09-07T09:30:00Z",
    });
    await addEntry({
      workspaceId: first.id,
      projectId: firstProject.id,
      workItemId: null,
      start: "2026-09-07T10:00:00Z",
      end: "2026-09-07T11:00:00Z",
      status: "PAUSED",
      segments: [
        ["2026-09-07T10:00:00Z", "2026-09-07T10:30:00Z"],
        ["2026-09-07T10:45:00Z", "2026-09-07T11:00:00Z"],
      ],
    });

    const secondProject = await createProject({
      actorUserId: other,
      slug: secondSlug,
      name: "Project B",
      description: null,
      status: "ACTIVE",
      estimatedMinutes: null,
    });
    ids.project.push(secondProject.id);
    await addEntry({
      workspaceId: second.id,
      projectId: secondProject.id,
      workItemId: null,
      start: "2026-09-07T08:00:00Z",
      end: "2026-09-07T13:00:00Z",
    });
  });

  afterAll(async () => {
    await db
      .delete(auditLog)
      .where(inArray(auditLog.workspaceId, ids.workspace));
    await db
      .delete(timeSegment)
      .where(inArray(timeSegment.workspaceId, ids.workspace));
    await db
      .delete(timeEntry)
      .where(inArray(timeEntry.workspaceId, ids.workspace));
    await db.delete(workItem).where(inArray(workItem.id, ids.workItem));
    await db.delete(project).where(inArray(project.id, ids.project));
    await db
      .delete(workspaceMember)
      .where(inArray(workspaceMember.workspaceId, ids.workspace));
    await db.delete(workspace).where(inArray(workspace.id, ids.workspace));
    await db.delete(user).where(inArray(user.id, [owner, other]));
  });

  it("keeps the personal total and project breakdown tenant-aware", async () => {
    const result = await getInsights({
      userId: owner,
      slug: firstSlug,
      query: { period: "this_week" },
      now: new Date("2026-09-07T14:00:00Z"),
    });
    expect(result.aggregation.trackedSeconds).toBe(135 * 60);
    expect(result.aggregation.projects).toEqual([
      expect.objectContaining({
        projectId: firstProjectId,
        trackedSeconds: 135 * 60,
      }),
    ]);
    expect(result.aggregation.workItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ workItemId: null, trackedSeconds: 45 * 60 }),
      ]),
    );
  });

  it("compares the estimated Work Item without counting project-only time", async () => {
    const result = await getInsights({
      userId: owner,
      slug: firstSlug,
      query: { period: "this_week" },
      now: new Date("2026-09-07T14:00:00Z"),
    });
    expect(result.aggregation.comparison).toEqual({
      estimatedMinutes: 60,
      trackedSeconds: 90 * 60,
      differenceSeconds: 30 * 60,
      source: "WORK_ITEMS",
    });
    expect(estimatedItemId).toBeTruthy();
  });

  it("does not include the same user's other Workspace", async () => {
    const result = await getInsights({
      userId: owner,
      slug: secondSlug,
      query: { period: "this_week" },
      now: new Date("2026-09-07T14:00:00Z"),
    });
    expect(result.aggregation.trackedSeconds).toBe(5 * 60 * 60);
  });
});

async function addEntry(input: {
  workspaceId: string;
  projectId: string;
  workItemId: string | null;
  start: string;
  end: string;
  status?: "COMPLETED" | "PAUSED";
  segments?: [string, string][];
}) {
  const segments = input.segments ?? [[input.start, input.end]];
  const created = await db
    .insert(timeEntry)
    .values({
      workspaceId: input.workspaceId,
      userId: owner,
      projectId: input.projectId,
      workItemId: input.workItemId,
      source: "MANUAL",
      status: input.status ?? "COMPLETED",
      startedAt: new Date(input.start),
      finishedAt: new Date(input.end),
      durationSeconds: segments.reduce(
        (sum, [start, end]) =>
          sum + (new Date(end).getTime() - new Date(start).getTime()) / 1000,
        0,
      ),
    })
    .returning({ id: timeEntry.id });
  ids.timeEntry.push(created[0]!.id);
  await db.insert(timeSegment).values(
    segments.map(([start, end]) => ({
      timeEntryId: created[0]!.id,
      userId: owner,
      workspaceId: input.workspaceId,
      startedAt: new Date(start),
      endedAt: new Date(end),
    })),
  );
}
