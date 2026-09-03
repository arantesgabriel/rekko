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
import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { createProject, createWorkItem } from "@/modules/projects/service";
import { createWorkspace } from "@/modules/workspaces/service";
import { parseReportQuery } from "./schemas";
import {
  exportTimeReportCsv,
  getReportFilterOptions,
  getTimeReport,
} from "./service";

const suffix = crypto.randomUUID().slice(0, 8);
const ids = {
  owner: `reports-owner-${suffix}`,
  admin: `reports-admin-${suffix}`,
  member: `reports-member-${suffix}`,
  removed: `reports-removed-${suffix}`,
  outsider: `reports-outsider-${suffix}`,
};
const workspaceIds: string[] = [];
const projectIds: string[] = [];
const workItemIds: string[] = [];
let firstSlug = "";
let secondSlug = "";
let firstProjectId = "";
let workItemId = "";
let secondWorkItemId = "";

const reportPeriod = {
  period: "custom" as const,
  start: "2026-09-01",
  end: "2026-09-01",
  page: 1,
};
const reportNow = new Date("2026-09-02T12:00:00.000Z");

describe.sequential("reports with PostgreSQL", () => {
  beforeAll(async () => {
    await db.insert(user).values([
      {
        id: ids.owner,
        name: "Reports Owner",
        email: `${ids.owner}@rekko.test`,
        timezone: "UTC",
      },
      {
        id: ids.admin,
        name: "Reports Admin",
        email: `${ids.admin}@rekko.test`,
        timezone: "UTC",
      },
      {
        id: ids.member,
        name: "Reports Member",
        email: `${ids.member}@rekko.test`,
        timezone: "UTC",
      },
      {
        id: ids.removed,
        name: "Reports Removed",
        email: `${ids.removed}@rekko.test`,
        timezone: "UTC",
      },
      {
        id: ids.outsider,
        name: "Reports Outsider",
        email: `${ids.outsider}@rekko.test`,
        timezone: "UTC",
      },
    ]);

    const first = await createWorkspace({
      userId: ids.owner,
      name: `Reports São Paulo ${suffix}`,
      timezone: "America/Sao_Paulo",
    });
    const second = await createWorkspace({
      userId: ids.outsider,
      name: `Reports Other ${suffix}`,
      timezone: "UTC",
    });
    workspaceIds.push(first.id, second.id);
    firstSlug = first.slug;
    secondSlug = second.slug;

    await db.insert(workspaceMember).values([
      {
        workspaceId: first.id,
        userId: ids.admin,
        role: "ADMIN",
        jobTitle: "Coordenação",
      },
      {
        workspaceId: first.id,
        userId: ids.member,
        role: "MEMBER",
        jobTitle: "Desenvolvimento",
      },
      {
        workspaceId: first.id,
        userId: ids.removed,
        role: "MEMBER",
        jobTitle: "Produto",
      },
      { workspaceId: second.id, userId: ids.owner, role: "MEMBER" },
    ]);

    const firstProject = await createProject({
      actorUserId: ids.owner,
      slug: firstSlug,
      name: "Relatórios Alpha",
      description: null,
      status: "ACTIVE",
      estimatedMinutes: null,
    });
    firstProjectId = firstProject.id;
    projectIds.push(firstProject.id);
    const item = await createWorkItem({
      actorUserId: ids.owner,
      slug: firstSlug,
      projectId: firstProject.id,
      title: "Demanda concluída",
      description: null,
      status: "DONE",
      estimatedMinutes: null,
      parentWorkItemId: null,
    });
    workItemId = item.id;
    workItemIds.push(item.id);

    await addEntry({
      workspaceId: first.id,
      userId: ids.owner,
      projectId: firstProject.id,
      workItemId: null,
      source: "MANUAL",
      start: "2026-09-01T13:00:00Z",
      end: "2026-09-01T14:00:00Z",
      description: "Owner launch",
    });
    await addEntry({
      workspaceId: first.id,
      userId: ids.admin,
      projectId: firstProject.id,
      workItemId: item.id,
      source: "TIMER",
      start: "2026-09-01T14:00:00Z",
      end: "2026-09-01T15:00:00Z",
    });
    await addEntry({
      workspaceId: first.id,
      userId: ids.member,
      projectId: firstProject.id,
      workItemId: null,
      source: "TIMER",
      start: "2026-09-01T15:00:00Z",
      end: "2026-09-01T16:30:00Z",
      segments: [
        ["2026-09-01T15:00:00Z", "2026-09-01T15:30:00Z"],
        ["2026-09-01T16:00:00Z", "2026-09-01T16:30:00Z"],
      ],
    });
    await addEntry({
      workspaceId: first.id,
      userId: ids.removed,
      projectId: firstProject.id,
      workItemId: null,
      source: "MANUAL",
      start: "2026-09-01T17:00:00Z",
      end: "2026-09-01T18:00:00Z",
    });
    await addEntry({
      workspaceId: first.id,
      userId: ids.owner,
      projectId: firstProject.id,
      workItemId: item.id,
      source: "MANUAL",
      start: "2026-09-02T02:30:00Z",
      end: "2026-09-02T03:30:00Z",
    });
    await db
      .update(project)
      .set({
        archivedAt: new Date("2026-09-01T19:00:00Z"),
        status: "COMPLETED",
      })
      .where(eq(project.id, firstProject.id));

    await db
      .delete(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, first.id),
          eq(workspaceMember.userId, ids.removed),
        ),
      );

    const secondProject = await createProject({
      actorUserId: ids.outsider,
      slug: secondSlug,
      name: "Other tenant project",
      description: null,
      status: "ACTIVE",
      estimatedMinutes: null,
    });
    projectIds.push(secondProject.id);
    secondWorkItemId = (
      await createWorkItem({
        actorUserId: ids.outsider,
        slug: secondSlug,
        projectId: secondProject.id,
        title: "Other tenant demand",
        description: null,
        status: "TODO",
        estimatedMinutes: null,
        parentWorkItemId: null,
      })
    ).id;
    workItemIds.push(secondWorkItemId);
    await addEntry({
      workspaceId: second.id,
      userId: ids.outsider,
      projectId: secondProject.id,
      workItemId: secondWorkItemId,
      source: "MANUAL",
      start: "2026-09-01T08:00:00Z",
      end: "2026-09-01T10:00:00Z",
    });
    await addEntry({
      workspaceId: second.id,
      userId: ids.owner,
      projectId: secondProject.id,
      workItemId: secondWorkItemId,
      source: "MANUAL",
      start: "2026-09-01T10:00:00Z",
      end: "2026-09-01T11:00:00Z",
    });
  });

  afterAll(async () => {
    await db
      .delete(auditLog)
      .where(inArray(auditLog.workspaceId, workspaceIds));
    await db
      .delete(timeSegment)
      .where(inArray(timeSegment.workspaceId, workspaceIds));
    await db
      .delete(timeEntry)
      .where(inArray(timeEntry.workspaceId, workspaceIds));
    await db.delete(workItem).where(inArray(workItem.id, workItemIds));
    await db.delete(project).where(inArray(project.id, projectIds));
    await db
      .delete(workspaceMember)
      .where(inArray(workspaceMember.workspaceId, workspaceIds));
    await db.delete(workspace).where(inArray(workspace.id, workspaceIds));
    await db.delete(user).where(inArray(user.id, Object.values(ids)));
  });

  it("shows all Workspace segments to Owner/Admin and only own segments to Member", async () => {
    const ownerReport = await getTimeReport({
      userId: ids.owner,
      slug: firstSlug,
      query: reportPeriod,
      now: reportNow,
    });
    expect(ownerReport.totalRows).toBe(2);
    expect(ownerReport.totalSeconds).toBe(1.5 * 60 * 60);
    expect(ownerReport.rows.map((row) => row.userId)).toEqual(
      expect.arrayContaining([ids.owner, ids.admin]),
    );

    const adminReport = await getTimeReport({
      userId: ids.admin,
      slug: firstSlug,
      query: reportPeriod,
      now: reportNow,
    });
    expect(adminReport.totalRows).toBe(2);
    expect(adminReport.totalSeconds).toBe(1.5 * 60 * 60);

    const memberReport = await getTimeReport({
      userId: ids.member,
      slug: firstSlug,
      query: { ...reportPeriod, userId: ids.removed },
      now: reportNow,
    });
    expect(memberReport.totalRows).toBe(0);
    expect(memberReport.totalSeconds).toBe(0);
    expect(memberReport.rows.every((row) => row.userId === ids.member)).toBe(
      true,
    );
    const clampedReport = await getTimeReport({
      userId: ids.owner,
      slug: firstSlug,
      query: { ...reportPeriod, page: 999 },
      now: reportNow,
    });
    expect(clampedReport.page).toBe(1);
    expect(clampedReport.rows).toHaveLength(2);

    const options = await getReportFilterOptions({
      userId: ids.owner,
      slug: firstSlug,
      projectId: firstProjectId,
    });
    expect(options.canViewWorkspace).toBe(true);
    expect(options.people).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: ids.removed,
          currentMember: false,
        }),
      ]),
    );
    expect(options.projects).toEqual([
      expect.objectContaining({
        id: firstProjectId,
        archivedAt: expect.any(Date),
      }),
    ]);
    expect(options.workItems).toEqual([
      expect.objectContaining({ id: workItemId, status: "DONE" }),
    ]);

    const memberOptions = await getReportFilterOptions({
      userId: ids.member,
      slug: firstSlug,
    });
    expect(memberOptions.canViewWorkspace).toBe(false);
    expect(memberOptions.people.map((person) => person.userId)).toEqual([
      ids.member,
    ]);
  });

  it("clips by Workspace timezone, filters by Work Item and exports every segment", async () => {
    const filtered = await getTimeReport({
      userId: ids.admin,
      slug: firstSlug,
      query: { ...reportPeriod, workItemId },
      now: reportNow,
    });
    expect(filtered.totalRows).toBe(2);
    expect(filtered.totalSeconds).toBe(1.5 * 60 * 60);
    expect(filtered.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          workItemId,
          source: "TIMER",
          durationSeconds: 60 * 60,
        }),
        expect.objectContaining({
          workItemId,
          source: "MANUAL",
          durationSeconds: 30 * 60,
        }),
      ]),
    );

    const filteredExport = await exportTimeReportCsv({
      userId: ids.admin,
      slug: firstSlug,
      query: { ...reportPeriod, workItemId },
      now: reportNow,
    });
    expect(filteredExport.rowCount).toBe(2);
    expect(filteredExport.csv).toContain('"Demanda concluída"');
    expect(filteredExport.csv).toContain('"Reports Owner"');

    const exported = await exportTimeReportCsv({
      userId: ids.owner,
      slug: firstSlug,
      query: reportPeriod,
      now: reportNow,
    });
    expect(exported.rowCount).toBe(2);
    expect(exported.csv.startsWith("\uFEFF")).toBe(true);
    expect(exported.csv).toContain('"Duração em Horas"');
    expect(exported.csv).toContain('"2026-09-01 23:30"');
    expect(exported.csv).toContain('"2026-09-02 00:00"');
  });

  it("keeps the report tenant-aware even when a Member forges another user filter", async () => {
    const report = await getTimeReport({
      userId: ids.owner,
      slug: secondSlug,
      query: { ...reportPeriod, userId: ids.outsider },
      now: reportNow,
    });
    expect(report.totalRows).toBe(1);
    expect(report.rows[0]?.userId).toBe(ids.owner);

    expect(
      parseReportQuery({
        period: "custom",
        start: "2026-09-01",
        end: "2026-09-01",
        projectId: firstProjectId,
      }).projectId,
    ).toBe(firstProjectId);
  });
});

async function addEntry(input: {
  workspaceId: string;
  userId: string;
  projectId: string;
  workItemId: string | null;
  source: "TIMER" | "MANUAL";
  start: string;
  end: string;
  segments?: [string, string][];
  description?: string;
}) {
  const segments = input.segments ?? [[input.start, input.end]];
  const durationSeconds = segments.reduce(
    (total, [start, end]) =>
      total + (new Date(end).getTime() - new Date(start).getTime()) / 1000,
    0,
  );
  const [created] = await db
    .insert(timeEntry)
    .values({
      workspaceId: input.workspaceId,
      userId: input.userId,
      projectId: input.projectId,
      workItemId: input.workItemId,
      source: input.source,
      status: "COMPLETED",
      description: input.description ?? null,
      startedAt: new Date(input.start),
      finishedAt: new Date(input.end),
      durationSeconds,
    })
    .returning({ id: timeEntry.id });
  if (!created) throw new Error("Time Entry insert returned no row");
  await db.insert(timeSegment).values(
    segments.map(([start, end]) => ({
      timeEntryId: created.id,
      userId: input.userId,
      workspaceId: input.workspaceId,
      startedAt: new Date(start),
      endedAt: new Date(end),
    })),
  );
}
