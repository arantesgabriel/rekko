import { describe, expect, it } from "vitest";

import {
  createsParentCycle,
  demandBreadcrumb,
  formatEstimate,
  parseEstimate,
} from "./domain";

describe("project domain", () => {
  it.each([
    ["30m", 30],
    ["1h", 60],
    ["1h 30m", 90],
    [" 2H 15M ", 135],
    ["", null],
  ])("normalizes %s", (value, expected) => {
    expect(parseEstimate(value)).toBe(expected);
  });

  it.each(["-1h", "banana", "0m", "999999999h"])("rejects %s", (value) =>
    expect(parseEstimate(value)).toBeUndefined(),
  );

  it("formats minutes", () => {
    expect(formatEstimate(90)).toBe("1h 30m");
    expect(formatEstimate(null)).toBe("Sem estimativa");
  });

  it("detects direct and indirect cycles", () => {
    const parents = new Map<string, string | null>([
      ["a", null],
      ["b", "a"],
    ]);
    expect(createsParentCycle("a", "b", parents)).toBe(true);
    expect(createsParentCycle("c", "b", parents)).toBe(false);
  });

  it("builds a readable breadcrumb for any hierarchy depth", () => {
    expect(
      demandBreadcrumb("task", [
        {
          id: "epic",
          title: "Implementar modelo ABCD",
          parentWorkItemId: null,
          externalIdentifier: "AC-1",
        },
        {
          id: "feature",
          title: "Backend",
          parentWorkItemId: "epic",
          externalIdentifier: null,
        },
        {
          id: "task",
          title: "Criar DTO XYZ",
          parentWorkItemId: "feature",
          externalIdentifier: null,
        },
      ]),
    ).toBe("AC-1 · Implementar modelo ABCD / Backend / Criar DTO XYZ");
  });
});
