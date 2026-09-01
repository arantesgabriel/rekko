import { describe, expect, it } from "vitest";

import { parseReportQuery } from "./schemas";

describe("reports query schema", () => {
  it("uses safe defaults and treats all as an omitted filter", () => {
    expect(
      parseReportQuery({
        period: "this_month",
        userId: "all",
        projectId: "all",
        workItemId: "all",
        page: "2",
      }),
    ).toEqual({
      period: "this_month",
      page: 2,
    });
  });

  it("accepts a valid custom Workspace period", () => {
    expect(
      parseReportQuery({
        period: "custom",
        start: "2026-09-01",
        end: "2026-09-30",
      }),
    ).toEqual({
      period: "custom",
      start: "2026-09-01",
      end: "2026-09-30",
      page: 1,
    });
  });

  it("falls back instead of trusting an invalid external query", () => {
    expect(
      parseReportQuery({
        period: "custom",
        start: "2026-10-01",
        end: "2026-09-01",
        page: "0",
      }),
    ).toEqual({ period: "this_week", page: 1 });
  });
});
