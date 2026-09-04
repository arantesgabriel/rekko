import { describe, expect, it } from "vitest";
import { aggregateInsightSegments, periodWindow } from "./domain";

const project = {
  projectId: "project-a",
  projectName: "Project A",
  projectEstimatedMinutes: null,
  workItemId: "item-a",
  workItemTitle: "Item A",
  workItemEstimatedMinutes: 120,
};

describe("insights domain", () => {
  it("clips segments at the selected week boundary", () => {
    const now = new Date("2026-09-07T12:00:00.000Z");
    const window = periodWindow("this_week", "UTC", now);
    const result = aggregateInsightSegments(
      [
        {
          ...project,
          startedAt: new Date("2026-09-06T23:00:00.000Z"),
          endedAt: new Date("2026-09-07T02:00:00.000Z"),
        },
      ],
      window,
      now,
    );
    expect(result.trackedSeconds).toBe(2 * 60 * 60);
  });

  it("excludes paused gaps because aggregation receives segments", () => {
    const window = {
      start: new Date("2026-09-07T08:00:00.000Z"),
      end: new Date("2026-09-07T12:00:00.000Z"),
    };
    const result = aggregateInsightSegments(
      [
        {
          ...project,
          startedAt: new Date("2026-09-07T08:00:00.000Z"),
          endedAt: new Date("2026-09-07T09:00:00.000Z"),
        },
        {
          ...project,
          startedAt: new Date("2026-09-07T10:00:00.000Z"),
          endedAt: new Date("2026-09-07T11:00:00.000Z"),
        },
      ],
      window,
      new Date("2026-09-07T12:00:00.000Z"),
    );
    expect(result.trackedSeconds).toBe(2 * 60 * 60);
  });

  it("keeps project and project-only totals consistent", () => {
    const window = {
      start: new Date("2026-09-07T00:00:00.000Z"),
      end: new Date("2026-09-08T00:00:00.000Z"),
    };
    const result = aggregateInsightSegments(
      [
        {
          ...project,
          startedAt: new Date("2026-09-07T08:00:00.000Z"),
          endedAt: new Date("2026-09-07T10:00:00.000Z"),
        },
        {
          ...project,
          workItemId: null,
          workItemTitle: null,
          workItemEstimatedMinutes: null,
          startedAt: new Date("2026-09-07T10:00:00.000Z"),
          endedAt: new Date("2026-09-07T11:00:00.000Z"),
        },
      ],
      window,
      new Date("2026-09-07T12:00:00.000Z"),
    );
    expect(result.projects[0]?.trackedSeconds).toBe(3 * 60 * 60);
    expect(
      result.workItems.reduce((sum, item) => sum + item.trackedSeconds, 0),
    ).toBe(result.trackedSeconds);
  });

  it("returns a daily series for the selected window", () => {
    const window = periodWindow(
      "this_week",
      "America/Sao_Paulo",
      new Date("2026-09-09T12:00:00.000Z"),
    );
    const result = aggregateInsightSegments(
      [
        {
          ...project,
          startedAt: new Date("2026-09-07T12:00:00.000Z"),
          endedAt: new Date("2026-09-07T13:30:00.000Z"),
        },
        {
          ...project,
          startedAt: new Date("2026-09-08T14:00:00.000Z"),
          endedAt: new Date("2026-09-08T15:00:00.000Z"),
        },
      ],
      window,
      new Date("2026-09-09T12:00:00.000Z"),
      "America/Sao_Paulo",
    );
    expect(result.days).toHaveLength(7);
    expect(result.days.slice(0, 2)).toEqual([
      { date: "2026-09-07", trackedSeconds: 90 * 60 },
      { date: "2026-09-08", trackedSeconds: 60 * 60 },
    ]);
  });

  it("does not compare unestimated time against zero", () => {
    const window = {
      start: new Date("2026-09-07T00:00:00.000Z"),
      end: new Date("2026-09-08T00:00:00.000Z"),
    };
    const result = aggregateInsightSegments(
      [
        {
          ...project,
          workItemEstimatedMinutes: null,
          startedAt: new Date("2026-09-07T08:00:00.000Z"),
          endedAt: new Date("2026-09-07T10:00:00.000Z"),
        },
      ],
      window,
      new Date("2026-09-07T12:00:00.000Z"),
    );
    expect(result.comparison).toBeNull();
    expect(result.trackedSeconds).toBe(2 * 60 * 60);
  });

  it("compares only estimated work items when coverage is partial", () => {
    const window = {
      start: new Date("2026-09-07T00:00:00.000Z"),
      end: new Date("2026-09-08T00:00:00.000Z"),
    };
    const result = aggregateInsightSegments(
      [
        {
          ...project,
          startedAt: new Date("2026-09-07T08:00:00.000Z"),
          endedAt: new Date("2026-09-07T11:00:00.000Z"),
        },
        {
          ...project,
          workItemId: "item-b",
          workItemTitle: "Item B",
          workItemEstimatedMinutes: null,
          startedAt: new Date("2026-09-07T11:00:00.000Z"),
          endedAt: new Date("2026-09-07T15:00:00.000Z"),
        },
      ],
      window,
      new Date("2026-09-07T16:00:00.000Z"),
    );
    expect(result.trackedSeconds).toBe(7 * 60 * 60);
    expect(result.comparison).toEqual({
      estimatedMinutes: 120,
      trackedSeconds: 3 * 60 * 60,
      differenceSeconds: 60 * 60,
      source: "WORK_ITEMS",
    });
  });

  it("computes positive and negative differences in seconds", () => {
    const window = {
      start: new Date("2026-09-07T00:00:00.000Z"),
      end: new Date("2026-09-08T00:00:00.000Z"),
    };
    const below = aggregateInsightSegments(
      [
        {
          ...project,
          workItemEstimatedMinutes: 180,
          startedAt: new Date("2026-09-07T08:00:00.000Z"),
          endedAt: new Date("2026-09-07T10:15:00.000Z"),
        },
      ],
      window,
      new Date("2026-09-07T12:00:00.000Z"),
    );
    expect(below.comparison?.differenceSeconds).toBe(-45 * 60);
  });

  it("starts weeks on Monday and includes the selected custom end date", () => {
    const now = new Date("2026-09-09T12:00:00.000Z");
    const week = periodWindow("this_week", "UTC", now);
    expect(week.start.toISOString()).toBe("2026-09-07T00:00:00.000Z");
    expect(week.end.toISOString()).toBe("2026-09-14T00:00:00.000Z");
    const custom = periodWindow("custom", "UTC", now, {
      start: "2026-09-01",
      end: "2026-09-03",
    });
    expect(custom.start.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(custom.end.toISOString()).toBe("2026-09-04T00:00:00.000Z");
  });

  it("omits work items whose clipped duration is zero", () => {
    const window = {
      start: new Date("2026-09-07T00:00:00.000Z"),
      end: new Date("2026-09-08T00:00:00.000Z"),
    };
    const result = aggregateInsightSegments(
      [
        {
          ...project,
          startedAt: new Date("2026-09-07T08:00:00.000Z"),
          endedAt: new Date("2026-09-07T09:00:00.000Z"),
        },
        {
          ...project,
          workItemId: "item-zero",
          workItemTitle: "Zero",
          startedAt: new Date("2026-09-06T22:00:00.000Z"),
          endedAt: new Date("2026-09-07T00:00:00.000Z"),
        },
      ],
      window,
      new Date("2026-09-07T12:00:00.000Z"),
    );
    expect(result.workItems.map((item) => item.workItemId)).toEqual(["item-a"]);
    expect(result.trackedSeconds).toBe(60 * 60);
  });

  it("rejects an inverted custom range", () => {
    expect(() =>
      periodWindow("custom", "UTC", new Date("2026-09-09T12:00:00.000Z"), {
        start: "2026-09-04",
        end: "2026-09-03",
      }),
    ).toThrow("Invalid custom period");
  });
});
