import { describe, expect, it } from "vitest";
import { durationSeconds, formatDuration } from "./domain";

describe("time tracking duration", () => {
  it("sums segments without counting pauses", () => {
    const date = (hour: number, minute = 0) =>
      new Date(Date.UTC(2026, 7, 26, hour, minute));
    expect(
      durationSeconds(
        [
          { startedAt: date(8), endedAt: date(9) },
          { startedAt: date(9, 30), endedAt: date(11) },
          { startedAt: date(12), endedAt: date(12, 30) },
        ],
        date(13),
      ),
    ).toBe(10_800);
  });

  it("uses now only for the open segment", () => {
    const start = new Date("2026-08-26T08:00:00Z");
    expect(
      durationSeconds(
        [{ startedAt: start, endedAt: null }],
        new Date("2026-08-26T09:00:00Z"),
      ),
    ).toBe(3600);
    expect(formatDuration(3661)).toBe("01:01:01");
  });
});
