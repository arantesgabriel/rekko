import { project, timeEntry, timeSegment, workItem } from "@rekko/db";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  ne,
  or,
  type SQL,
} from "drizzle-orm";

import { db } from "@/lib/db";
import { requireWorkspace } from "@/modules/workspaces/service";
import { recordAudit } from "@/modules/audit/service";

import {
  sortDemands,
  type DemandSortDir,
  type DemandSortKey,
} from "./demand-sort";
import { createsParentCycle, demandBreadcrumb } from "./domain";
import { ProjectError } from "./errors";
import { listAccessibleDemandHierarchy } from "./hierarchy-service";

export type ProjectListItem = {
  id: string;
  name: string;
  description: string | null;
  source: "MANUAL" | "LINEAR";
  status: "ACTIVE" | "COMPLETED";
  estimatedMinutes: number | null;
  workItemCount: number;
  activeDemandCount: number;
  trackedSeconds: number;
  lastActivityAt: Date | null;
};

export type ProjectSummary = {
  demandCount: number;
  activeDemandCount: number;
  trackedSeconds: number;
  lastActivityAt: Date | null;
};

export async function listProjects(userId: string, slug: string) {
  const context = await requireWorkspace(userId, slug);
  const [rows, demandRows, timeRows] = await Promise.all([
    db
      .select({
        id: project.id,
        name: project.name,
        description: project.description,
        source: project.source,
        status: project.status,
        estimatedMinutes: project.estimatedMinutes,
        workItemCount: count(workItem.id),
      })
      .from(project)
      .leftJoin(
        workItem,
        and(
          eq(workItem.projectId, project.id),
          eq(workItem.workspaceId, context.id),
          isNull(workItem.archivedAt),
        ),
      )
      .where(
        and(eq(project.workspaceId, context.id), isNull(project.archivedAt)),
      )
      .groupBy(project.id)
      .orderBy(desc(project.updatedAt)),
    db
      .select({ projectId: workItem.projectId, status: workItem.status })
      .from(workItem)
      .where(
        and(eq(workItem.workspaceId, context.id), isNull(workItem.archivedAt)),
      ),
    db
      .select({
        projectId: timeEntry.projectId,
        startedAt: timeSegment.startedAt,
        endedAt: timeSegment.endedAt,
      })
      .from(timeSegment)
      .innerJoin(timeEntry, eq(timeEntry.id, timeSegment.timeEntryId))
      .innerJoin(
        workItem,
        and(
          eq(workItem.id, timeEntry.workItemId),
          eq(workItem.workspaceId, context.id),
        ),
      )
      .where(
        and(
          eq(timeSegment.workspaceId, context.id),
          eq(timeEntry.workspaceId, context.id),
          isNull(timeEntry.archivedAt),
          ne(timeEntry.status, "ARCHIVED"),
        ),
      ),
  ]);
  const now = new Date();
  const metrics = new Map<
    string,
    {
      activeDemandCount: number;
      trackedSeconds: number;
      lastActivityAt: Date | null;
    }
  >();
  for (const demand of demandRows) {
    const current = metrics.get(demand.projectId) ?? {
      activeDemandCount: 0,
      trackedSeconds: 0,
      lastActivityAt: null,
    };
    if (demand.status !== "DONE") current.activeDemandCount += 1;
    metrics.set(demand.projectId, current);
  }
  for (const segment of timeRows) {
    const current = metrics.get(segment.projectId) ?? {
      activeDemandCount: 0,
      trackedSeconds: 0,
      lastActivityAt: null,
    };
    const end = segment.endedAt ?? now;
    current.trackedSeconds += Math.max(
      0,
      Math.floor((end.getTime() - segment.startedAt.getTime()) / 1000),
    );
    const activityAt = segment.endedAt ?? segment.startedAt;
    if (
      !current.lastActivityAt ||
      activityAt.getTime() > current.lastActivityAt.getTime()
    ) {
      current.lastActivityAt = activityAt;
    }
    metrics.set(segment.projectId, current);
  }
  const projects: ProjectListItem[] = rows.map((row) => ({
    ...row,
    ...(metrics.get(row.id) ?? {
      activeDemandCount: 0,
      trackedSeconds: 0,
      lastActivityAt: null,
    }),
  }));
  return { context, projects };
}

export type DemandListItem = {
  id: string;
  title: string;
  description: string | null;
  source: "MANUAL" | "LINEAR";
  externalIdentifier: string | null;
  externalUrl: string | null;
  parentWorkItemId: string | null;
  workItemBreadcrumb: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  isActive: boolean;
  estimatedMinutes: number | null;
  projectId: string;
  projectName: string;
  projectSource: "MANUAL" | "LINEAR";
  projectStatus: "ACTIVE" | "COMPLETED";
  trackedSeconds: number;
  recordCount: number;
  lastActivityAt: Date | null;
  isRunning: boolean;
  recentRecords: DemandTimeRecord[];
};

export type DemandTimeRecord = {
  id: string;
  source: "TIMER" | "MANUAL";
  status: "RUNNING" | "PAUSED" | "COMPLETED" | "ARCHIVED";
  description: string | null;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number;
};

export type DemandProjectOption = { id: string; name: string };
export type DemandParentOption = {
  id: string;
  projectId: string;
  title: string;
  workItemBreadcrumb: string;
};

export async function listDemandParentOptions(userId: string, slug: string) {
  const context = await requireWorkspace(userId, slug);
  const parents = await db
    .select({
      id: workItem.id,
      projectId: workItem.projectId,
      title: workItem.title,
    })
    .from(workItem)
    .innerJoin(
      project,
      and(
        eq(project.id, workItem.projectId),
        eq(project.workspaceId, context.id),
      ),
    )
    .where(
      and(
        eq(workItem.workspaceId, context.id),
        eq(workItem.source, "MANUAL"),
        isNull(workItem.archivedAt),
        isNull(project.archivedAt),
        eq(project.status, "ACTIVE"),
      ),
    )
    .orderBy(asc(workItem.title));

  const hierarchy = await listAccessibleDemandHierarchy(userId, context.id);
  return {
    context,
    parents: parents.map((parent) => ({
      ...parent,
      workItemBreadcrumb: demandBreadcrumb(parent.id, hierarchy),
    })) satisfies DemandParentOption[],
  };
}

export async function listDemands(input: {
  userId: string;
  slug: string;
  search?: string;
  status?: "ALL" | "ACTIVE" | "DONE";
  projectId?: string;
  sort?: DemandSortKey;
  dir?: DemandSortDir;
}) {
  const context = await requireWorkspace(input.userId, input.slug);
  const filters: SQL[] = [
    eq(workItem.workspaceId, context.id),
    isNull(workItem.archivedAt),
    isNull(project.archivedAt),
  ];
  const search = input.search?.trim();
  if (search) {
    filters.push(
      or(
        ilike(workItem.title, `%${search}%`),
        ilike(workItem.externalIdentifier, `%${search}%`),
        ilike(project.name, `%${search}%`),
      )!,
    );
  }
  if (input.projectId) filters.push(eq(workItem.projectId, input.projectId));
  const listFilters = [...filters];
  if (input.status === "ACTIVE")
    listFilters.push(inArray(workItem.status, ["TODO", "IN_PROGRESS"]));
  if (input.status === "DONE") listFilters.push(eq(workItem.status, "DONE"));

  const [rows, statusRows, projectOptions, parentOptions, hierarchy] =
    await Promise.all([
      db
        .select({
          id: workItem.id,
          title: workItem.title,
          description: workItem.description,
          source: workItem.source,
          externalIdentifier: workItem.externalIdentifier,
          externalUrl: workItem.externalUrl,
          parentWorkItemId: workItem.parentWorkItemId,
          status: workItem.status,
          isActive: workItem.isActive,
          estimatedMinutes: workItem.estimatedMinutes,
          projectId: project.id,
          projectName: project.name,
          projectSource: project.source,
          projectStatus: project.status,
        })
        .from(workItem)
        .innerJoin(
          project,
          and(
            eq(project.id, workItem.projectId),
            eq(project.workspaceId, context.id),
          ),
        )
        .where(and(...listFilters))
        .orderBy(desc(workItem.updatedAt), asc(workItem.title)),
      db
        .select({
          status: workItem.status,
          total: count(),
        })
        .from(workItem)
        .innerJoin(
          project,
          and(
            eq(project.id, workItem.projectId),
            eq(project.workspaceId, context.id),
          ),
        )
        .where(and(...filters))
        .groupBy(workItem.status),
      db
        .select({ id: project.id, name: project.name })
        .from(project)
        .where(
          and(eq(project.workspaceId, context.id), isNull(project.archivedAt)),
        )
        .orderBy(asc(project.name)),
      db
        .select({
          id: workItem.id,
          projectId: workItem.projectId,
          title: workItem.title,
        })
        .from(workItem)
        .where(
          and(
            eq(workItem.workspaceId, context.id),
            eq(workItem.source, "MANUAL"),
            isNull(workItem.archivedAt),
          ),
        )
        .orderBy(asc(workItem.title)),
      listAccessibleDemandHierarchy(input.userId, context.id),
    ]);

  const summaries = await getDemandSummaries(
    context.id,
    input.userId,
    rows.map((row) => row.id),
  );
  const demands = sortDemands(
    rows.map((row) =>
      toDemandListItem(
        row,
        {
          id: row.projectId,
          name: row.projectName,
          source: row.projectSource,
          status: row.projectStatus,
        },
        summaries.get(row.id),
        demandBreadcrumb(row.id, hierarchy),
      ),
    ),
    input.sort ?? "updated",
    input.dir ?? "desc",
  );
  const doneCount = statusRows
    .filter((row) => row.status === "DONE")
    .reduce((sum, row) => sum + Number(row.total), 0);
  const activeCount = statusRows
    .filter((row) => row.status !== "DONE")
    .reduce((sum, row) => sum + Number(row.total), 0);
  return {
    context,
    counts: {
      all: activeCount + doneCount,
      active: activeCount,
      done: doneCount,
    },
    demands,
    projectOptions: projectOptions satisfies DemandProjectOption[],
    parentOptions: parentOptions.map((parent) => ({
      ...parent,
      workItemBreadcrumb: demandBreadcrumb(parent.id, hierarchy),
    })) satisfies DemandParentOption[],
  };
}

export async function requireProject(
  userId: string,
  slug: string,
  projectId: string,
) {
  const context = await requireWorkspace(userId, slug);
  const [record] = await db
    .select()
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.workspaceId, context.id)))
    .limit(1);
  if (!record) throw new ProjectError("PROJECT_NOT_FOUND");
  return { context, project: record };
}

export async function getProjectPage(input: {
  userId: string;
  slug: string;
  projectId: string;
  search?: string;
  status?: "ALL" | "TODO" | "IN_PROGRESS" | "DONE";
  kind?: "ALL" | "ROOT" | "SUB_ITEM";
}) {
  const result = await requireProject(
    input.userId,
    input.slug,
    input.projectId,
  );
  const filters: SQL[] = [
    eq(workItem.workspaceId, result.context.id),
    eq(workItem.projectId, result.project.id),
    isNull(workItem.archivedAt),
  ];
  if (input.search?.trim())
    filters.push(ilike(workItem.title, `%${input.search.trim()}%`));
  if (input.status && input.status !== "ALL")
    filters.push(eq(workItem.status, input.status));
  if (input.kind === "ROOT") filters.push(isNull(workItem.parentWorkItemId));
  const rows = await db
    .select()
    .from(workItem)
    .where(and(...filters))
    .orderBy(asc(workItem.createdAt));
  const visible =
    input.kind === "SUB_ITEM"
      ? rows.filter((item) => item.parentWorkItemId !== null)
      : rows;
  const summaries = await getDemandSummaries(
    result.context.id,
    input.userId,
    visible.map((item) => item.id),
  );
  const hierarchy = await listAccessibleDemandHierarchy(
    input.userId,
    result.context.id,
  );
  const demandItems = visible.map((item) =>
    toDemandListItem(
      item,
      {
        id: result.project.id,
        name: result.project.name,
        source: result.project.source,
        status: result.project.status,
      },
      summaries.get(item.id),
      demandBreadcrumb(item.id, hierarchy),
    ),
  );
  const allItems = await db
    .select({
      id: workItem.id,
      title: workItem.title,
      source: workItem.source,
      parentWorkItemId: workItem.parentWorkItemId,
      status: workItem.status,
    })
    .from(workItem)
    .where(
      and(
        eq(workItem.workspaceId, result.context.id),
        eq(workItem.projectId, result.project.id),
        isNull(workItem.archivedAt),
      ),
    )
    .orderBy(asc(workItem.createdAt));
  const projectTimeRows = await db
    .select({
      startedAt: timeSegment.startedAt,
      endedAt: timeSegment.endedAt,
    })
    .from(timeSegment)
    .innerJoin(timeEntry, eq(timeEntry.id, timeSegment.timeEntryId))
    .innerJoin(
      workItem,
      and(
        eq(workItem.id, timeEntry.workItemId),
        eq(workItem.projectId, result.project.id),
        eq(workItem.workspaceId, result.context.id),
      ),
    )
    .where(
      and(
        eq(timeSegment.workspaceId, result.context.id),
        eq(timeEntry.workspaceId, result.context.id),
        eq(timeEntry.projectId, result.project.id),
        isNull(timeEntry.archivedAt),
        ne(timeEntry.status, "ARCHIVED"),
      ),
    );
  const now = new Date();
  const projectSummary: ProjectSummary = {
    demandCount: allItems.length,
    activeDemandCount: allItems.filter((item) => item.status !== "DONE").length,
    trackedSeconds: projectTimeRows.reduce((total, row) => {
      const end = row.endedAt ?? now;
      return (
        total +
        Math.max(
          0,
          Math.floor((end.getTime() - row.startedAt.getTime()) / 1000),
        )
      );
    }, 0),
    lastActivityAt: projectTimeRows.reduce<Date | null>((latest, row) => {
      const activityAt = row.endedAt ?? row.startedAt;
      return !latest || activityAt.getTime() > latest.getTime()
        ? activityAt
        : latest;
    }, null),
  };
  const parentOptions = allItems
    .filter((item) => item.source === "MANUAL")
    .map((item) => ({
      id: item.id,
      projectId: result.project.id,
      title: item.title,
      workItemBreadcrumb: demandBreadcrumb(item.id, hierarchy),
    }));
  return {
    ...result,
    items: visible,
    demandItems,
    parentOptions: parentOptions satisfies DemandParentOption[],
    projectSummary,
  };
}

export async function createProject(input: {
  actorUserId: string;
  slug: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "COMPLETED";
  estimatedMinutes: number | null;
}) {
  const context = await requireWorkspace(
    input.actorUserId,
    input.slug,
    "project:manage",
  );
  const [created] = await db
    .insert(project)
    .values({
      workspaceId: context.id,
      createdByUserId: input.actorUserId,
      name: input.name,
      description: input.description,
      status: input.status,
      estimatedMinutes: input.estimatedMinutes,
      source: "MANUAL",
    })
    .returning({ id: project.id });
  if (!created) throw new Error("Project insert returned no row");
  return created;
}

export async function updateProject(
  input: Parameters<typeof createProject>[0] & { projectId: string },
) {
  const context = await validateMutableProject(input);
  const [updated] = await db
    .update(project)
    .set({
      name: input.name,
      description: input.description,
      status: input.status,
      estimatedMinutes: input.estimatedMinutes,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(project.id, input.projectId),
        eq(project.workspaceId, context.id),
        isNull(project.archivedAt),
      ),
    )
    .returning({ id: project.id });
  if (!updated) throw new ProjectError("PROJECT_NOT_FOUND");
}

export async function archiveProject(input: {
  actorUserId: string;
  slug: string;
  projectId: string;
}) {
  const context = await validateMutableProject(input);
  await db.transaction(async (tx) => {
    const [archived] = await tx
      .update(project)
      .set({ archivedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(project.id, input.projectId),
          eq(project.workspaceId, context.id),
          isNull(project.archivedAt),
        ),
      )
      .returning({
        id: project.id,
        name: project.name,
        status: project.status,
      });
    if (!archived) throw new ProjectError("PROJECT_NOT_FOUND");
    await recordAudit(tx, {
      workspaceId: context.id,
      actorUserId: input.actorUserId,
      entityType: "project",
      entityId: archived.id,
      action: "project_archived",
      beforeJson: { name: archived.name, status: archived.status },
      afterJson: { archived: true },
    });
  });
}

type WorkItemMutation = {
  actorUserId: string;
  slug: string;
  projectId: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  estimatedMinutes: number | null;
  parentWorkItemId: string | null;
};

type WorkItemDraft = Pick<
  WorkItemMutation,
  "title" | "description" | "status" | "estimatedMinutes" | "parentWorkItemId"
>;

export type WorkItemCreation = WorkItemMutation &
  (
    | { parentMode: "NONE"; newParent?: never }
    | { parentMode: "EXISTING"; newParent?: never }
    | { parentMode: "NEW"; newParent: WorkItemDraft }
  );

type DemandSummary = {
  trackedSeconds: number;
  entryIds: Set<string>;
  lastActivityAt: Date | null;
  isRunning: boolean;
  records: Map<string, DemandTimeRecord>;
};

async function getDemandSummaries(
  workspaceId: string,
  userId: string,
  itemIds: string[],
) {
  if (!itemIds.length) return new Map<string, DemandSummary>();
  const segments = await db
    .select({
      entryId: timeEntry.id,
      workItemId: timeEntry.workItemId,
      entrySource: timeEntry.source,
      entryDescription: timeEntry.description,
      entryStatus: timeEntry.status,
      entryStartedAt: timeEntry.startedAt,
      entryFinishedAt: timeEntry.finishedAt,
      segmentStartedAt: timeSegment.startedAt,
      segmentEndedAt: timeSegment.endedAt,
    })
    .from(timeSegment)
    .innerJoin(timeEntry, eq(timeEntry.id, timeSegment.timeEntryId))
    .where(
      and(
        eq(timeSegment.workspaceId, workspaceId),
        eq(timeSegment.userId, userId),
        eq(timeEntry.userId, userId),
        isNull(timeEntry.archivedAt),
        ne(timeEntry.status, "ARCHIVED"),
        inArray(timeEntry.workItemId, itemIds),
      ),
    );
  const now = new Date();
  const summaries = new Map<string, DemandSummary>();
  for (const segment of segments) {
    if (!segment.workItemId) continue;
    const summary = summaries.get(segment.workItemId) ?? {
      trackedSeconds: 0,
      entryIds: new Set<string>(),
      lastActivityAt: null,
      isRunning: false,
      records: new Map<string, DemandTimeRecord>(),
    };
    const end = segment.segmentEndedAt ?? now;
    const seconds = Math.max(
      0,
      Math.floor((end.getTime() - segment.segmentStartedAt.getTime()) / 1000),
    );
    summary.trackedSeconds += seconds;
    summary.entryIds.add(segment.entryId);
    summary.isRunning ||= segment.entryStatus === "RUNNING";
    const activityAt = segment.segmentEndedAt ?? segment.segmentStartedAt;
    if (
      !summary.lastActivityAt ||
      activityAt.getTime() > summary.lastActivityAt.getTime()
    ) {
      summary.lastActivityAt = activityAt;
    }
    const record = summary.records.get(segment.entryId) ?? {
      id: segment.entryId,
      source: segment.entrySource,
      status: segment.entryStatus,
      description: segment.entryDescription,
      startedAt: segment.entryStartedAt,
      endedAt: segment.entryFinishedAt,
      durationSeconds: 0,
    };
    record.durationSeconds += seconds;
    if (
      !record.endedAt &&
      segment.segmentEndedAt &&
      segment.segmentEndedAt.getTime() > record.startedAt.getTime()
    ) {
      record.endedAt = segment.segmentEndedAt;
    }
    summary.records.set(segment.entryId, record);
    summaries.set(segment.workItemId, summary);
  }
  return summaries;
}

function toDemandListItem(
  row: {
    id: string;
    title: string;
    description: string | null;
    source: "MANUAL" | "LINEAR";
    externalIdentifier: string | null;
    externalUrl: string | null;
    parentWorkItemId: string | null;
    status: "TODO" | "IN_PROGRESS" | "DONE";
    isActive: boolean;
    estimatedMinutes: number | null;
  },
  projectData: {
    id: string;
    name: string;
    source: "MANUAL" | "LINEAR";
    status: "ACTIVE" | "COMPLETED";
  },
  summary?: DemandSummary,
  workItemBreadcrumb?: string,
): DemandListItem {
  const recentRecords = summary
    ? [...summary.records.values()]
        .sort((a, b) => {
          const aAt = a.endedAt ?? a.startedAt;
          const bAt = b.endedAt ?? b.startedAt;
          return bAt.getTime() - aAt.getTime();
        })
        .slice(0, 5)
    : [];
  return {
    ...row,
    projectId: projectData.id,
    projectName: projectData.name,
    projectSource: projectData.source,
    projectStatus: projectData.status,
    workItemBreadcrumb: workItemBreadcrumb || null,
    trackedSeconds: summary?.trackedSeconds ?? 0,
    recordCount: summary
      ? [...summary.records.values()].filter(
          (record) =>
            record.status === "COMPLETED" &&
            Boolean(record.endedAt) &&
            record.durationSeconds > 0,
        ).length
      : 0,
    lastActivityAt: summary?.lastActivityAt ?? null,
    isRunning: summary?.isRunning ?? false,
    recentRecords,
  };
}

async function validateMutableProject(
  input: Pick<WorkItemMutation, "actorUserId" | "slug" | "projectId">,
) {
  const context = await requireWorkspace(
    input.actorUserId,
    input.slug,
    "project:manage",
  );
  const [record] = await db
    .select({
      id: project.id,
      archivedAt: project.archivedAt,
      source: project.source,
    })
    .from(project)
    .where(
      and(eq(project.id, input.projectId), eq(project.workspaceId, context.id)),
    )
    .limit(1);
  if (!record) throw new ProjectError("PROJECT_NOT_FOUND");
  if (record.archivedAt) throw new ProjectError("PROJECT_ARCHIVED");
  if (record.source === "LINEAR") throw new ProjectError("SOURCE_READ_ONLY");
  return context;
}

async function validateParent(input: WorkItemMutation & { itemId?: string }) {
  if (!input.parentWorkItemId) return;
  const context = await requireWorkspace(input.actorUserId, input.slug);
  const rows = await db
    .select({ id: workItem.id, parentWorkItemId: workItem.parentWorkItemId })
    .from(workItem)
    .where(
      and(
        eq(workItem.workspaceId, context.id),
        eq(workItem.projectId, input.projectId),
        eq(workItem.source, "MANUAL"),
        isNull(workItem.archivedAt),
      ),
    );
  const parents = new Map(rows.map((row) => [row.id, row.parentWorkItemId]));
  if (!parents.has(input.parentWorkItemId))
    throw new ProjectError("INVALID_PARENT");
  if (
    input.itemId &&
    createsParentCycle(input.itemId, input.parentWorkItemId, parents)
  )
    throw new ProjectError("PARENT_CYCLE");
}

export async function createWorkItem(input: WorkItemMutation) {
  return createWorkItemWithParent({
    ...input,
    parentMode: input.parentWorkItemId ? "EXISTING" : "NONE",
  });
}

function workItemValues(
  workspaceId: string,
  projectId: string,
  input: WorkItemDraft,
) {
  return {
    workspaceId,
    projectId,
    source: "MANUAL" as const,
    estimateSource: "MANUAL" as const,
    title: input.title,
    description: input.description,
    status: input.status,
    isActive: input.status !== "DONE",
    estimatedMinutes: input.estimatedMinutes,
    parentWorkItemId: input.parentWorkItemId,
  };
}

export async function createWorkItemWithParent(input: WorkItemCreation) {
  const context = await validateMutableProject(input);
  if (input.parentMode === "EXISTING") await validateParent(input);
  if (input.parentMode === "NEW") {
    await validateParent({
      ...input,
      parentWorkItemId: input.newParent.parentWorkItemId,
    });
  }

  return db.transaction(async (tx) => {
    let parentWorkItemId = input.parentWorkItemId;
    let parentId: string | null = null;
    if (input.parentMode === "NEW") {
      const [parent] = await tx
        .insert(workItem)
        .values(workItemValues(context.id, input.projectId, input.newParent))
        .returning({ id: workItem.id });
      if (!parent) throw new Error("Parent work item insert returned no row");
      parentWorkItemId = parent.id;
      parentId = parent.id;
    }

    const [created] = await tx
      .insert(workItem)
      .values(
        workItemValues(context.id, input.projectId, {
          ...input,
          parentWorkItemId,
        }),
      )
      .returning({ id: workItem.id });
    if (!created) throw new Error("Work item insert returned no row");
    return { id: created.id, parentId };
  });
}

export async function updateWorkItem(
  input: WorkItemMutation & { itemId: string },
) {
  const context = await validateMutableProject(input);
  await validateParent(input);
  const [updated] = await db
    .update(workItem)
    .set({
      title: input.title,
      description: input.description,
      status: input.status,
      isActive: input.status !== "DONE",
      estimatedMinutes: input.estimatedMinutes,
      parentWorkItemId: input.parentWorkItemId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(workItem.id, input.itemId),
        eq(workItem.workspaceId, context.id),
        eq(workItem.projectId, input.projectId),
        isNull(workItem.archivedAt),
      ),
    )
    .returning({ id: workItem.id });
  if (!updated) throw new ProjectError("WORK_ITEM_NOT_FOUND");
}

export async function setWorkItemStatus(input: {
  actorUserId: string;
  slug: string;
  itemId: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
}) {
  const context = await requireWorkspace(
    input.actorUserId,
    input.slug,
    "project:manage",
  );
  const [item] = await db
    .select({
      id: workItem.id,
      projectId: workItem.projectId,
      source: workItem.source,
    })
    .from(workItem)
    .where(
      and(
        eq(workItem.id, input.itemId),
        eq(workItem.workspaceId, context.id),
        isNull(workItem.archivedAt),
      ),
    )
    .limit(1);
  if (!item) throw new ProjectError("WORK_ITEM_NOT_FOUND");
  if (item.source === "LINEAR") throw new ProjectError("SOURCE_READ_ONLY");
  await validateMutableProject({
    actorUserId: input.actorUserId,
    slug: input.slug,
    projectId: item.projectId,
  });
  const [updated] = await db
    .update(workItem)
    .set({
      status: input.status,
      isActive: input.status !== "DONE",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(workItem.id, item.id),
        eq(workItem.workspaceId, context.id),
        eq(workItem.projectId, item.projectId),
        isNull(workItem.archivedAt),
      ),
    )
    .returning({ id: workItem.id });
  if (!updated) throw new ProjectError("WORK_ITEM_NOT_FOUND");
}

export async function moveWorkItem(input: {
  actorUserId: string;
  slug: string;
  itemId: string;
  targetProjectId: string;
}) {
  const context = await requireWorkspace(
    input.actorUserId,
    input.slug,
    "project:manage",
  );
  const [item] = await db
    .select({
      id: workItem.id,
      projectId: workItem.projectId,
      source: workItem.source,
      parentWorkItemId: workItem.parentWorkItemId,
    })
    .from(workItem)
    .where(
      and(
        eq(workItem.id, input.itemId),
        eq(workItem.workspaceId, context.id),
        isNull(workItem.archivedAt),
      ),
    )
    .limit(1);
  if (!item) throw new ProjectError("WORK_ITEM_NOT_FOUND");
  if (item.source === "LINEAR") throw new ProjectError("SOURCE_READ_ONLY");
  const childRows = await db
    .select({
      id: workItem.id,
      parentWorkItemId: workItem.parentWorkItemId,
      source: workItem.source,
    })
    .from(workItem)
    .where(eq(workItem.workspaceId, context.id));
  const childrenByParent = new Map<string, string[]>();
  for (const row of childRows) {
    if (!row.parentWorkItemId) continue;
    const children = childrenByParent.get(row.parentWorkItemId) ?? [];
    children.push(row.id);
    childrenByParent.set(row.parentWorkItemId, children);
  }
  const subtreeIds = new Set<string>();
  const pendingIds = [item.id];
  while (pendingIds.length > 0) {
    const currentId = pendingIds.pop();
    if (!currentId || subtreeIds.has(currentId)) continue;
    subtreeIds.add(currentId);
    pendingIds.push(...(childrenByParent.get(currentId) ?? []));
  }
  const subtree = childRows.filter((row) => subtreeIds.has(row.id));
  if (subtree.some((row) => row.source === "LINEAR"))
    throw new ProjectError("SOURCE_READ_ONLY");
  await validateMutableProject({
    actorUserId: input.actorUserId,
    slug: input.slug,
    projectId: item.projectId,
  });
  const [target] = await db
    .select({ id: project.id, source: project.source, status: project.status })
    .from(project)
    .where(
      and(
        eq(project.id, input.targetProjectId),
        eq(project.workspaceId, context.id),
        isNull(project.archivedAt),
      ),
    )
    .limit(1);
  if (!target) throw new ProjectError("PROJECT_NOT_FOUND");
  if (target.source === "LINEAR") throw new ProjectError("SOURCE_READ_ONLY");
  if (target.status !== "ACTIVE") throw new ProjectError("PROJECT_ARCHIVED");
  if (target.id === item.projectId) return { movedCount: 0 };
  const subtreeIdList = [...subtreeIds];
  await db.transaction(async (tx) => {
    const entries = await tx
      .select({ id: timeEntry.id, workItemId: timeEntry.workItemId })
      .from(timeEntry)
      .where(
        and(
          eq(timeEntry.workspaceId, context.id),
          inArray(timeEntry.workItemId, subtreeIdList),
          eq(timeEntry.projectId, item.projectId),
        ),
      )
      .for("update");
    if (entries.length > 0) {
      const entryIds = entries.map((entry) => entry.id);
      await tx
        .update(timeEntry)
        .set({ projectId: target.id, workItemId: null, updatedAt: new Date() })
        .where(inArray(timeEntry.id, entryIds));
    }
    await tx
      .update(workItem)
      .set({ parentWorkItemId: null, updatedAt: new Date() })
      .where(
        and(
          inArray(workItem.id, subtreeIdList),
          eq(workItem.workspaceId, context.id),
        ),
      );
    await tx
      .update(workItem)
      .set({ projectId: target.id, updatedAt: new Date() })
      .where(
        and(
          inArray(workItem.id, subtreeIdList),
          eq(workItem.workspaceId, context.id),
        ),
      );
    for (const entry of entries) {
      if (!entry.workItemId) continue;
      await tx
        .update(timeEntry)
        .set({ workItemId: entry.workItemId, updatedAt: new Date() })
        .where(
          and(
            eq(timeEntry.id, entry.id),
            eq(timeEntry.workspaceId, context.id),
          ),
        );
    }
    for (const row of subtree) {
      if (!row.parentWorkItemId || !subtreeIds.has(row.parentWorkItemId))
        continue;
      await tx
        .update(workItem)
        .set({ parentWorkItemId: row.parentWorkItemId, updatedAt: new Date() })
        .where(
          and(eq(workItem.id, row.id), eq(workItem.workspaceId, context.id)),
        );
    }
    await recordAudit(tx, {
      workspaceId: context.id,
      actorUserId: input.actorUserId,
      entityType: "work_item",
      entityId: item.id,
      action: "work_item_moved",
      beforeJson: {
        projectId: item.projectId,
        parentWorkItemId: item.parentWorkItemId,
      },
      afterJson: {
        projectId: target.id,
        parentWorkItemId: null,
        movedCount: subtreeIds.size,
      },
    });
  });
  return { movedCount: subtreeIds.size };
}

export async function duplicateWorkItem(input: {
  actorUserId: string;
  slug: string;
  itemId: string;
}) {
  const context = await requireWorkspace(
    input.actorUserId,
    input.slug,
    "project:manage",
  );
  const [item] = await db
    .select({
      projectId: workItem.projectId,
      source: workItem.source,
      title: workItem.title,
      description: workItem.description,
      estimatedMinutes: workItem.estimatedMinutes,
    })
    .from(workItem)
    .where(
      and(
        eq(workItem.id, input.itemId),
        eq(workItem.workspaceId, context.id),
        isNull(workItem.archivedAt),
      ),
    )
    .limit(1);
  if (!item) throw new ProjectError("WORK_ITEM_NOT_FOUND");
  if (item.source === "LINEAR") throw new ProjectError("SOURCE_READ_ONLY");
  await validateMutableProject({
    actorUserId: input.actorUserId,
    slug: input.slug,
    projectId: item.projectId,
  });
  const [created] = await db
    .insert(workItem)
    .values({
      workspaceId: context.id,
      projectId: item.projectId,
      source: "MANUAL",
      estimateSource: "MANUAL",
      title: `${item.title} (cópia)`,
      description: item.description,
      status: "TODO",
      isActive: true,
      estimatedMinutes: item.estimatedMinutes,
      parentWorkItemId: null,
    })
    .returning({ id: workItem.id });
  if (!created) throw new Error("Work item duplicate returned no row");
  return created;
}

export async function archiveWorkItem(input: {
  actorUserId: string;
  slug: string;
  itemId: string;
}) {
  const context = await requireWorkspace(
    input.actorUserId,
    input.slug,
    "project:manage",
  );
  const [item] = await db
    .select({
      id: workItem.id,
      projectId: workItem.projectId,
      source: workItem.source,
    })
    .from(workItem)
    .where(
      and(
        eq(workItem.id, input.itemId),
        eq(workItem.workspaceId, context.id),
        isNull(workItem.archivedAt),
      ),
    )
    .limit(1);
  if (!item) throw new ProjectError("WORK_ITEM_NOT_FOUND");
  if (item.source === "LINEAR") throw new ProjectError("SOURCE_READ_ONLY");
  await validateMutableProject({
    actorUserId: input.actorUserId,
    slug: input.slug,
    projectId: item.projectId,
  });
  const [activeTimer] = await db
    .select({ id: timeEntry.id })
    .from(timeEntry)
    .where(
      and(
        eq(timeEntry.workspaceId, context.id),
        eq(timeEntry.workItemId, item.id),
        inArray(timeEntry.status, ["RUNNING", "PAUSED"]),
      ),
    )
    .limit(1);
  if (activeTimer) throw new ProjectError("WORK_ITEM_HAS_ACTIVE_TIMER");
  const [child] = await db
    .select({ id: workItem.id })
    .from(workItem)
    .where(
      and(
        eq(workItem.workspaceId, context.id),
        eq(workItem.parentWorkItemId, item.id),
        isNull(workItem.archivedAt),
      ),
    )
    .limit(1);
  if (child) throw new ProjectError("WORK_ITEM_HAS_CHILDREN");
  await db.transaction(async (tx) => {
    await tx
      .update(workItem)
      .set({ archivedAt: new Date(), isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(workItem.id, item.id),
          eq(workItem.workspaceId, context.id),
          isNull(workItem.archivedAt),
        ),
      );
    await recordAudit(tx, {
      workspaceId: context.id,
      actorUserId: input.actorUserId,
      entityType: "work_item",
      entityId: item.id,
      action: "work_item_archived",
      beforeJson: { projectId: item.projectId },
      afterJson: { archived: true },
    });
  });
}
