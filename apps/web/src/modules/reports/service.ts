import {
  project,
  timeEntry,
  timeSegment,
  user,
  workItem,
  workspaceMember,
} from "@rekko/db";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  isNull,
  lt,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/lib/db";
import { clipInterval, intervalSeconds } from "@/modules/timeline/domain";
import { periodWindow } from "@/modules/insights/domain";
import { requireWorkspace } from "@/modules/workspaces/service";
import {
  buildReportCsv,
  buildReportFilename,
  formatReportDate,
  formatReportDateTime,
  formatReportDecimalHours,
  formatReportDuration,
  reportSourceLabel,
  type ReportCsvRow,
} from "./domain";
import type { ReportQuery } from "./schemas";

const REPORT_PAGE_SIZE = 50;

export type ReportRow = {
  segmentId: string;
  entryId: string;
  entryStatus: "RUNNING" | "PAUSED" | "COMPLETED" | "ARCHIVED";
  entryStartedAt: Date;
  entryFinishedAt: Date | null;
  userId: string;
  collaboratorName: string;
  email: string;
  jobTitle: string | null;
  projectId: string;
  projectName: string;
  workItemId: string | null;
  workItemIdentifier: string | null;
  workItemTitle: string | null;
  source: "TIMER" | "MANUAL";
  description: string | null;
  startedAt: Date;
  endedAt: Date;
  durationSeconds: number;
};

export type ReportFilterOptions = {
  people: Array<{
    userId: string;
    name: string;
    email: string;
    role: "OWNER" | "ADMIN" | "MEMBER" | null;
    jobTitle: string | null;
    currentMember: boolean;
  }>;
  projects: Array<{
    id: string;
    name: string;
    status: "ACTIVE" | "COMPLETED";
    archivedAt: Date | null;
  }>;
  workItems: Array<{
    id: string;
    projectId: string;
    title: string;
    status: "TODO" | "IN_PROGRESS" | "DONE";
    source: "MANUAL" | "LINEAR";
    externalIdentifier: string | null;
    archivedAt: Date | null;
  }>;
  canViewWorkspace: boolean;
  canCorrectTime: boolean;
  currentUserId: string;
};

type ReportScope = {
  context: Awaited<ReturnType<typeof requireWorkspace>>;
  query: ReportQuery;
  now: Date;
  window: { start: Date; end: Date };
  effectiveUserId: string | undefined;
};

export async function getTimeReport(input: {
  userId: string;
  slug: string;
  query: ReportQuery;
  now?: Date;
}) {
  const scope = await createScope(input);
  const pageSize = REPORT_PAGE_SIZE;
  const requestedPage = Math.min(scope.query.page, 10_000);
  const summary = await countReportRows(scope);
  const totalRows = Number(summary.rowCount);
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const page = Math.min(requestedPage, pageCount);
  const rawRows = await selectReportRows(scope, {
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  return {
    context: scope.context,
    timezone: scope.context.timezone,
    period: scope.query,
    window: scope.window,
    rows: mapReportRows(rawRows, scope),
    totalRows,
    totalSeconds: Number(summary.totalSeconds),
    page: Math.min(page, pageCount),
    pageSize,
    pageCount,
  };
}

export async function getReportFilterOptions(input: {
  userId: string;
  slug: string;
  projectId?: string;
}): Promise<ReportFilterOptions> {
  const context = await requireWorkspace(input.userId, input.slug);
  const memberRows = await db
    .select({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: workspaceMember.role,
      jobTitle: workspaceMember.jobTitle,
    })
    .from(workspaceMember)
    .innerJoin(user, eq(user.id, workspaceMember.userId))
    .where(eq(workspaceMember.workspaceId, context.id));
  const historyRows = await db
    .selectDistinct({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: workspaceMember.role,
      jobTitle: workspaceMember.jobTitle,
    })
    .from(timeEntry)
    .innerJoin(user, eq(user.id, timeEntry.userId))
    .leftJoin(
      workspaceMember,
      and(
        eq(workspaceMember.workspaceId, context.id),
        eq(workspaceMember.userId, timeEntry.userId),
      ),
    )
    .where(eq(timeEntry.workspaceId, context.id));
  const peopleById = new Map<string, ReportFilterOptions["people"][number]>();
  for (const person of [...memberRows, ...historyRows]) {
    peopleById.set(person.userId, {
      ...person,
      currentMember: person.role !== null,
    });
  }
  const people = [...peopleById.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );
  const visiblePeople =
    context.role === "MEMBER"
      ? people.filter((person) => person.userId === input.userId)
      : people;
  const [projects, workItems] = await Promise.all([
    db
      .select({
        id: project.id,
        name: project.name,
        status: project.status,
        archivedAt: project.archivedAt,
      })
      .from(project)
      .where(eq(project.workspaceId, context.id))
      .orderBy(asc(project.name)),
    db
      .select({
        id: workItem.id,
        projectId: workItem.projectId,
        title: workItem.title,
        status: workItem.status,
        source: workItem.source,
        externalIdentifier: workItem.externalIdentifier,
        archivedAt: workItem.archivedAt,
      })
      .from(workItem)
      .where(
        and(
          eq(workItem.workspaceId, context.id),
          input.projectId ? eq(workItem.projectId, input.projectId) : undefined,
        ),
      )
      .orderBy(asc(workItem.title)),
  ]);

  return {
    people: visiblePeople,
    projects,
    workItems,
    canViewWorkspace: context.role !== "MEMBER",
    canCorrectTime: context.role === "OWNER",
    currentUserId: input.userId,
  };
}

export async function exportTimeReportCsv(input: {
  userId: string;
  slug: string;
  query: ReportQuery;
  now?: Date;
}) {
  const scope = await createScope(input);
  const rows = mapReportRows(await selectReportRows(scope), scope);
  const csvRows = rows.map((row) => toCsvRow(row, scope.context.timezone));
  const start = formatReportDate(scope.window.start, scope.context.timezone);
  const end = formatReportDate(
    new Date(scope.window.end.getTime() - 1),
    scope.context.timezone,
  );
  return {
    csv: buildReportCsv(csvRows),
    filename: buildReportFilename(scope.context.slug, start, end),
    rowCount: rows.length,
    totalSeconds: rows.reduce((total, row) => total + row.durationSeconds, 0),
  };
}

async function createScope(input: {
  userId: string;
  slug: string;
  query: ReportQuery;
  now?: Date;
}): Promise<ReportScope> {
  const context = await requireWorkspace(input.userId, input.slug);
  const now = input.now ?? new Date();
  const window = periodWindow(input.query.period, context.timezone, now, {
    start: input.query.start ?? "",
    end: input.query.end ?? "",
  });
  return {
    context,
    query: input.query,
    now,
    window,
    effectiveUserId:
      context.role === "MEMBER" ? input.userId : input.query.userId,
  };
}

function reportWhere(scope: ReportScope) {
  return and(
    eq(timeSegment.workspaceId, scope.context.id),
    eq(timeEntry.workspaceId, scope.context.id),
    eq(timeSegment.userId, timeEntry.userId),
    scope.effectiveUserId
      ? eq(timeEntry.userId, scope.effectiveUserId)
      : undefined,
    // ARCHIVED TimeEntries follow the existing operational visibility policy;
    // archived Projects/Work Items remain reportable through their local snapshot.
    sql`${timeEntry.status} <> 'ARCHIVED'`,
    lt(timeSegment.startedAt, scope.window.end),
    or(
      isNull(timeSegment.endedAt),
      gt(timeSegment.endedAt, scope.window.start),
    ),
    scope.query.projectId
      ? eq(timeEntry.projectId, scope.query.projectId)
      : undefined,
    scope.query.workItemId
      ? eq(timeEntry.workItemId, scope.query.workItemId)
      : undefined,
  );
}

function reportSelection() {
  return {
    segmentId: timeSegment.id,
    entryId: timeEntry.id,
    entryStatus: timeEntry.status,
    entryStartedAt: timeEntry.startedAt,
    entryFinishedAt: timeEntry.finishedAt,
    userId: timeEntry.userId,
    collaboratorName: user.name,
    email: user.email,
    jobTitle: workspaceMember.jobTitle,
    projectId: project.id,
    projectName: project.name,
    workItemId: workItem.id,
    workItemIdentifier: workItem.externalIdentifier,
    workItemTitle: workItem.title,
    source: timeEntry.source,
    description: timeEntry.description,
    startedAt: timeSegment.startedAt,
    endedAt: timeSegment.endedAt,
  };
}

async function selectReportRows(
  scope: ReportScope,
  pagination?: { limit: number; offset: number },
) {
  const query = db
    .select(reportSelection())
    .from(timeSegment)
    .innerJoin(timeEntry, eq(timeEntry.id, timeSegment.timeEntryId))
    .innerJoin(user, eq(user.id, timeEntry.userId))
    .innerJoin(project, eq(project.id, timeEntry.projectId))
    .leftJoin(workItem, eq(workItem.id, timeEntry.workItemId))
    .leftJoin(
      workspaceMember,
      and(
        eq(workspaceMember.workspaceId, scope.context.id),
        eq(workspaceMember.userId, timeEntry.userId),
      ),
    )
    .where(reportWhere(scope))
    .orderBy(desc(timeSegment.startedAt), desc(timeSegment.id));
  if (pagination)
    return query.limit(pagination.limit).offset(pagination.offset);
  return query;
}

async function countReportRows(scope: ReportScope) {
  const start = sql`greatest(${timeSegment.startedAt}, ${scope.window.start.toISOString()}::timestamptz)`;
  const end = sql`least(coalesce(${timeSegment.endedAt}, ${scope.now.toISOString()}::timestamptz), ${scope.window.end.toISOString()}::timestamptz)`;
  const totalSeconds = sql<number>`coalesce(sum(floor(extract(epoch from (${end} - ${start})))), 0)`;
  const [summary] = await db
    .select({ rowCount: count(), totalSeconds })
    .from(timeSegment)
    .innerJoin(timeEntry, eq(timeEntry.id, timeSegment.timeEntryId))
    .where(reportWhere(scope));
  return summary ?? { rowCount: 0, totalSeconds: 0 };
}

function mapReportRows(
  rows: Awaited<ReturnType<typeof selectReportRows>>,
  scope: ReportScope,
): ReportRow[] {
  return rows.flatMap((row) => {
    const clipped = clipInterval(
      { start: row.startedAt, end: row.endedAt ?? scope.now },
      scope.window,
    );
    if (!clipped) return [];
    return [
      {
        ...row,
        endedAt: clipped.end,
        durationSeconds: intervalSeconds(clipped),
      },
    ];
  });
}

function toCsvRow(row: ReportRow, timezone: string): ReportCsvRow {
  return {
    Data: formatReportDate(row.startedAt, timezone),
    Colaborador: row.collaboratorName,
    Email: row.email,
    Cargo: row.jobTitle ?? "",
    Projeto: row.projectName,
    "Código da Demanda": row.workItemIdentifier ?? "",
    Demanda: row.workItemTitle ?? "",
    Início: formatReportDateTime(row.startedAt, timezone),
    Fim: formatReportDateTime(row.endedAt, timezone),
    Duração: formatReportDuration(row.durationSeconds),
    "Duração em Horas": formatReportDecimalHours(row.durationSeconds),
    // The MVP has no activity-type domain model; source remains the Timer/Manual distinction.
    "Tipo de Atividade": "",
    Descrição: row.description ?? "",
    Origem: reportSourceLabel(row.source),
  };
}
