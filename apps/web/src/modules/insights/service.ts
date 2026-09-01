import { project, timeEntry, timeSegment, user, workItem } from "@rekko/db";
import { and, asc, desc, eq, gt, isNull, lt, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { requireWorkspace } from "@/modules/workspaces/service";
import {
  aggregateInsightSegments,
  periodWindow,
  type InsightAggregation,
} from "./domain";
import type { InsightsQuery } from "./schemas";

export type InsightProjectOption = {
  id: string;
  name: string;
  status: "ACTIVE" | "COMPLETED";
  archivedAt: Date | null;
};

export type InsightsResult = {
  context: Awaited<ReturnType<typeof requireWorkspace>>;
  timezone: string;
  period: InsightsQuery;
  window: { start: Date; end: Date };
  projects: InsightProjectOption[];
  aggregation: InsightAggregation;
};

export async function getInsights(input: {
  userId: string;
  slug: string;
  query: InsightsQuery;
  now?: Date;
}): Promise<InsightsResult> {
  const context = await requireWorkspace(input.userId, input.slug);
  const [person] = await db
    .select({ timezone: user.timezone })
    .from(user)
    .where(eq(user.id, input.userId))
    .limit(1);
  if (!person) throw new Error("User timezone not found");

  const now = input.now ?? new Date();
  const window = periodWindow(input.query.period, person.timezone, now, {
    start: input.query.start ?? "",
    end: input.query.end ?? "",
  });
  const trackedSeconds = sql<number>`floor(sum(extract(epoch from (least(coalesce(${timeSegment.endedAt}, ${now.toISOString()}::timestamptz), ${window.end.toISOString()}::timestamptz) - greatest(${timeSegment.startedAt}, ${window.start.toISOString()}::timestamptz)))))`;
  const filters = [
    eq(timeSegment.workspaceId, context.id),
    eq(timeEntry.workspaceId, context.id),
    eq(timeEntry.userId, input.userId),
    eq(timeSegment.userId, input.userId),
    sql`${timeEntry.status} <> 'ARCHIVED'`,
    lt(timeSegment.startedAt, window.end),
    or(isNull(timeSegment.endedAt), gt(timeSegment.endedAt, window.start)),
    input.query.projectId
      ? eq(timeEntry.projectId, input.query.projectId)
      : undefined,
  ];
  const rows = await db
    .select({
      projectId: project.id,
      projectName: project.name,
      projectEstimatedMinutes: project.estimatedMinutes,
      workItemId: workItem.id,
      workItemTitle: workItem.title,
      workItemEstimatedMinutes: workItem.estimatedMinutes,
      trackedSeconds,
    })
    .from(timeSegment)
    .innerJoin(timeEntry, eq(timeEntry.id, timeSegment.timeEntryId))
    .innerJoin(project, eq(project.id, timeEntry.projectId))
    .leftJoin(workItem, eq(workItem.id, timeEntry.workItemId))
    .where(and(...filters))
    .groupBy(
      project.id,
      project.name,
      project.estimatedMinutes,
      workItem.id,
      workItem.title,
      workItem.estimatedMinutes,
    )
    .orderBy(desc(trackedSeconds));

  const segments = rows.map((row) => ({
    projectId: row.projectId,
    projectName: row.projectName,
    projectEstimatedMinutes: row.projectEstimatedMinutes,
    workItemId: row.workItemId,
    workItemTitle: row.workItemTitle,
    workItemEstimatedMinutes: row.workItemEstimatedMinutes,
    startedAt: window.start,
    endedAt: new Date(
      window.start.getTime() + Number(row.trackedSeconds) * 1000,
    ),
  }));
  const aggregation = aggregateInsightSegments(segments, window, now);
  const projects = await db
    .select({
      id: project.id,
      name: project.name,
      status: project.status,
      archivedAt: project.archivedAt,
    })
    .from(project)
    .where(
      and(
        eq(project.workspaceId, context.id),
        input.query.projectId
          ? eq(project.id, input.query.projectId)
          : undefined,
      ),
    )
    .orderBy(asc(project.name));

  return {
    context,
    timezone: person.timezone,
    period: input.query,
    window,
    projects,
    aggregation,
  };
}
