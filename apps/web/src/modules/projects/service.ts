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

import { createsParentCycle } from "./domain";
import { ProjectError } from "./errors";

export async function listProjects(userId: string, slug: string) {
  const context = await requireWorkspace(userId, slug);
  const rows = await db
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
    .where(and(eq(project.workspaceId, context.id), isNull(project.archivedAt)))
    .groupBy(project.id)
    .orderBy(desc(project.updatedAt));
  return { context, projects: rows };
}

export type DemandListItem = {
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
  projectId: string;
  projectName: string;
  projectSource: "MANUAL" | "LINEAR";
  projectStatus: "ACTIVE" | "COMPLETED";
  trackedSeconds: number;
  recordCount: number;
  lastActivityAt: Date | null;
  isRunning: boolean;
};

export type DemandProjectOption = { id: string; name: string };

export async function listDemands(input: {
  userId: string;
  slug: string;
  search?: string;
  status?: "ALL" | "ACTIVE" | "DONE";
  projectId?: string;
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
  if (input.status === "ACTIVE")
    filters.push(inArray(workItem.status, ["TODO", "IN_PROGRESS"]));
  if (input.status === "DONE") filters.push(eq(workItem.status, "DONE"));
  if (input.projectId) filters.push(eq(workItem.projectId, input.projectId));

  const [rows, projectOptions] = await Promise.all([
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
      .where(and(...filters))
      .orderBy(desc(workItem.updatedAt), asc(workItem.title)),
    db
      .select({ id: project.id, name: project.name })
      .from(project)
      .where(
        and(eq(project.workspaceId, context.id), isNull(project.archivedAt)),
      )
      .orderBy(asc(project.name)),
  ]);

  const itemIds = rows.map((row) => row.id);
  const segments = itemIds.length
    ? await db
        .select({
          entryId: timeEntry.id,
          workItemId: timeEntry.workItemId,
          startedAt: timeSegment.startedAt,
          endedAt: timeSegment.endedAt,
        })
        .from(timeSegment)
        .innerJoin(timeEntry, eq(timeEntry.id, timeSegment.timeEntryId))
        .where(
          and(
            eq(timeSegment.workspaceId, context.id),
            eq(timeSegment.userId, input.userId),
            eq(timeEntry.userId, input.userId),
            ne(timeEntry.status, "ARCHIVED"),
            inArray(timeEntry.workItemId, itemIds),
          ),
        )
    : [];
  const now = new Date();
  const summaries = new Map<
    string,
    {
      trackedSeconds: number;
      entryIds: Set<string>;
      lastActivityAt: Date | null;
      isRunning: boolean;
    }
  >();
  for (const segment of segments) {
    if (!segment.workItemId) continue;
    const summary = summaries.get(segment.workItemId) ?? {
      trackedSeconds: 0,
      entryIds: new Set<string>(),
      lastActivityAt: null,
      isRunning: false,
    };
    const end = segment.endedAt ?? now;
    summary.trackedSeconds += Math.max(
      0,
      Math.floor((end.getTime() - segment.startedAt.getTime()) / 1000),
    );
    summary.entryIds.add(segment.entryId);
    summary.isRunning ||= segment.endedAt === null;
    const activityAt = segment.endedAt ?? segment.startedAt;
    if (
      !summary.lastActivityAt ||
      activityAt.getTime() > summary.lastActivityAt.getTime()
    ) {
      summary.lastActivityAt = activityAt;
    }
    summaries.set(segment.workItemId, summary);
  }

  const demands: DemandListItem[] = rows.map((row) => {
    const summary = summaries.get(row.id);
    return {
      ...row,
      trackedSeconds: summary?.trackedSeconds ?? 0,
      recordCount: summary?.entryIds.size ?? 0,
      lastActivityAt: summary?.lastActivityAt ?? null,
      isRunning: summary?.isRunning ?? false,
    };
  });
  return {
    context,
    demands,
    projectOptions: projectOptions satisfies DemandProjectOption[],
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
  const allItems = await db
    .select({
      id: workItem.id,
      title: workItem.title,
      parentWorkItemId: workItem.parentWorkItemId,
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
  return { ...result, items: visible, parentOptions: allItems };
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
  const context = await requireWorkspace(
    input.actorUserId,
    input.slug,
    "project:manage",
  );
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
  const context = await requireWorkspace(
    input.actorUserId,
    input.slug,
    "project:manage",
  );
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
  const context = await validateMutableProject(input);
  await validateParent(input);
  const [created] = await db
    .insert(workItem)
    .values({
      workspaceId: context.id,
      projectId: input.projectId,
      source: "MANUAL",
      estimateSource: "MANUAL",
      title: input.title,
      description: input.description,
      status: input.status,
      estimatedMinutes: input.estimatedMinutes,
      parentWorkItemId: input.parentWorkItemId,
    })
    .returning({ id: workItem.id });
  if (!created) throw new Error("Work item insert returned no row");
  return created;
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
