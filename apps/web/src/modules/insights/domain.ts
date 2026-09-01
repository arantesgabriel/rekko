import {
  clipInterval,
  dayWindow,
  intervalSeconds,
  type Interval,
  zonedDateTimeToUtc,
} from "@/modules/timeline/domain";

export type InsightsPeriod =
  "today" | "this_week" | "last_week" | "this_month" | "custom";

export type InsightSegment = {
  projectId: string;
  projectName: string;
  projectEstimatedMinutes: number | null;
  workItemId: string | null;
  workItemTitle: string | null;
  workItemEstimatedMinutes: number | null;
  startedAt: Date;
  endedAt: Date | null;
};

export type InsightProject = {
  projectId: string;
  projectName: string;
  estimatedMinutes: number | null;
  trackedSeconds: number;
};

export type InsightWorkItem = {
  projectId: string;
  projectName: string;
  workItemId: string | null;
  workItemTitle: string;
  estimatedMinutes: number | null;
  trackedSeconds: number;
};

export type InsightComparison = {
  estimatedMinutes: number;
  trackedSeconds: number;
  differenceSeconds: number;
  source: "PROJECT" | "WORK_ITEMS" | "MIXED";
};

export type InsightAggregation = {
  trackedSeconds: number;
  projects: InsightProject[];
  workItems: InsightWorkItem[];
  comparisonItems: InsightWorkItem[];
  comparison: InsightComparison | null;
  comparisonProjects: Array<InsightProject & { comparison: InsightComparison }>;
};

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return dateOnly(value);
}

function weekStart(date: string) {
  const value = new Date(`${date}T12:00:00.000Z`);
  const mondayOffset = (value.getUTCDay() + 6) % 7;
  return shiftDate(date, -mondayOffset);
}

export function periodWindow(
  period: InsightsPeriod,
  timezone: string,
  now: Date,
  custom?: { start: string; end: string },
): Interval {
  const today = dateOnlyInTimezone(now, timezone);
  if (period === "today") return dayWindow(today, timezone);
  if (period === "this_week") {
    const start = weekStart(today);
    return {
      start: zonedDateTimeToUtc(`${start}T00:00:00`, timezone),
      end: zonedDateTimeToUtc(`${shiftDate(start, 7)}T00:00:00`, timezone),
    };
  }
  if (period === "last_week") {
    const start = shiftDate(weekStart(today), -7);
    return {
      start: zonedDateTimeToUtc(`${start}T00:00:00`, timezone),
      end: zonedDateTimeToUtc(`${shiftDate(start, 7)}T00:00:00`, timezone),
    };
  }
  if (period === "this_month") {
    const start = `${today.slice(0, 7)}-01`;
    return {
      start: zonedDateTimeToUtc(`${start}T00:00:00`, timezone),
      end: zonedDateTimeToUtc(
        `${shiftDate(start, 32).slice(0, 7)}-01T00:00:00`,
        timezone,
      ),
    };
  }
  if (!custom || custom.start > custom.end)
    throw new RangeError("Invalid custom period");
  return {
    start: zonedDateTimeToUtc(`${custom.start}T00:00:00`, timezone),
    end: zonedDateTimeToUtc(`${shiftDate(custom.end, 1)}T00:00:00`, timezone),
  };
}

function dateOnlyInTimezone(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function aggregateInsightSegments(
  segments: readonly InsightSegment[],
  window: Interval,
  now: Date,
): InsightAggregation {
  const projects = new Map<string, InsightProject>();
  const workItems = new Map<string, InsightWorkItem>();

  for (const segment of segments) {
    const clipped = clipInterval(
      { start: segment.startedAt, end: segment.endedAt ?? now },
      window,
    );
    if (!clipped) continue;
    const seconds = intervalSeconds(clipped);
    const project = projects.get(segment.projectId) ?? {
      projectId: segment.projectId,
      projectName: segment.projectName,
      estimatedMinutes: segment.projectEstimatedMinutes,
      trackedSeconds: 0,
    };
    project.trackedSeconds += seconds;
    projects.set(segment.projectId, project);

    const key = `${segment.projectId}:${segment.workItemId ?? "project-only"}`;
    const workItem = workItems.get(key) ?? {
      projectId: segment.projectId,
      projectName: segment.projectName,
      workItemId: segment.workItemId,
      workItemTitle: segment.workItemTitle ?? "Somente projeto",
      estimatedMinutes: segment.workItemEstimatedMinutes,
      trackedSeconds: 0,
    };
    workItem.trackedSeconds += seconds;
    workItems.set(key, workItem);
  }

  const projectList = [...projects.values()].sort(byTrackedDescending);
  const workItemList = [...workItems.values()].sort(byTrackedDescending);
  const comparisonItems = workItemList.filter(
    (item) => item.workItemId !== null && item.estimatedMinutes !== null,
  );
  const comparisonProjects = projectList
    .map((project) => {
      if (project.estimatedMinutes !== null) {
        return {
          ...project,
          comparison: {
            estimatedMinutes: project.estimatedMinutes,
            trackedSeconds: project.trackedSeconds,
            differenceSeconds:
              project.trackedSeconds - project.estimatedMinutes * 60,
            source: "PROJECT" as const,
          },
        };
      }
      const items = comparisonItems.filter(
        (item) => item.projectId === project.projectId,
      );
      if (!items.length) return null;
      const itemComparison = comparisonFromItems(items);
      return { ...project, comparison: itemComparison };
    })
    .filter(
      (
        project,
      ): project is InsightProject & { comparison: InsightComparison } =>
        project !== null,
    );
  const comparison = comparisonProjects.length
    ? {
        estimatedMinutes: comparisonProjects.reduce(
          (total, project) => total + project.comparison.estimatedMinutes,
          0,
        ),
        trackedSeconds: comparisonProjects.reduce(
          (total, project) => total + project.comparison.trackedSeconds,
          0,
        ),
        differenceSeconds: comparisonProjects.reduce(
          (total, project) => total + project.comparison.differenceSeconds,
          0,
        ),
        source: comparisonProjects.every(
          (project) => project.comparison.source === "PROJECT",
        )
          ? ("PROJECT" as const)
          : comparisonProjects.every(
                (project) => project.comparison.source === "WORK_ITEMS",
              )
            ? ("WORK_ITEMS" as const)
            : ("MIXED" as const),
      }
    : null;

  return {
    trackedSeconds: projectList.reduce(
      (total, project) => total + project.trackedSeconds,
      0,
    ),
    projects: projectList,
    workItems: workItemList,
    comparisonItems,
    comparison,
    comparisonProjects,
  };
}

function comparisonFromItems(
  items: readonly InsightWorkItem[],
): InsightComparison {
  const estimatedMinutes = items.reduce(
    (total, item) => total + (item.estimatedMinutes ?? 0),
    0,
  );
  const trackedSeconds = items.reduce(
    (total, item) => total + item.trackedSeconds,
    0,
  );
  return {
    estimatedMinutes,
    trackedSeconds,
    differenceSeconds: trackedSeconds - estimatedMinutes * 60,
    source: "WORK_ITEMS",
  };
}

function byTrackedDescending(
  a: { trackedSeconds: number },
  b: { trackedSeconds: number },
) {
  return b.trackedSeconds - a.trackedSeconds;
}
