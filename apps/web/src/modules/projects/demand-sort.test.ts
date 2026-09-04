import { describe, expect, it } from "vitest";

import { parseDemandSort, sortDemands } from "./demand-sort";

const items = [
  {
    title: "Zebra",
    externalIdentifier: null,
    projectName: "Beta",
    trackedSeconds: 3600,
    estimatedMinutes: 30,
    lastActivityAt: new Date("2026-01-02T00:00:00Z"),
  },
  {
    title: "Alpha",
    externalIdentifier: "RK-2",
    projectName: "Alpha",
    trackedSeconds: 120,
    estimatedMinutes: 120,
    lastActivityAt: new Date("2026-01-03T00:00:00Z"),
  },
  {
    title: "Meio",
    externalIdentifier: null,
    projectName: "Gama",
    trackedSeconds: 7200,
    estimatedMinutes: null,
    lastActivityAt: null,
  },
];

describe("parseDemandSort", () => {
  it("falls back to updated desc", () => {
    expect(parseDemandSort(undefined, undefined)).toEqual({
      sort: "updated",
      dir: "desc",
    });
  });

  it("accepts known keys", () => {
    expect(parseDemandSort("tracked", "asc")).toEqual({
      sort: "tracked",
      dir: "asc",
    });
  });
});

describe("sortDemands", () => {
  it("sorts titles alphabetically", () => {
    expect(
      sortDemands(items, "title", "asc").map((item) => item.title),
    ).toEqual(["Alpha", "Meio", "Zebra"]);
  });

  it("sorts tracked time high to low", () => {
    expect(
      sortDemands(items, "tracked", "desc").map((item) => item.trackedSeconds),
    ).toEqual([7200, 3600, 120]);
  });

  it("treats missing estimates as zero", () => {
    expect(
      sortDemands(items, "estimate", "asc").map(
        (item) => item.estimatedMinutes,
      ),
    ).toEqual([null, 30, 120]);
  });

  it("sorts missing activity as oldest", () => {
    expect(
      sortDemands(items, "updated", "asc").map((item) => item.title),
    ).toEqual(["Meio", "Zebra", "Alpha"]);
  });
});
