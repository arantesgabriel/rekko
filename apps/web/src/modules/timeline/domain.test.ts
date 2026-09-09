import { describe, expect, it } from "vitest";
import {
  addCalendarDays,
  calculateGaps,
  clipInterval,
  dayWindow,
  formatDateInput,
  formatCompactDuration,
  formatWeekStripDuration,
  intervalSeconds,
  intervalsOverlap,
  isDisplayableSession,
  parseDateInput,
  startOfIsoWeek,
  weekDates,
  zonedDateTimeToUtc,
} from "./domain";

const at = (value: string) => new Date(value);

describe("timeline intervals", () => {
  it("detects overlap while allowing adjacent intervals", () => {
    const existing = {
      start: at("2026-08-27T08:00:00Z"),
      end: at("2026-08-27T09:00:00Z"),
    };
    expect(
      intervalsOverlap(existing, {
        start: at("2026-08-27T08:30:00Z"),
        end: at("2026-08-27T09:30:00Z"),
      }),
    ).toBe(true);
    expect(
      intervalsOverlap(existing, {
        start: at("2026-08-27T09:00:00Z"),
        end: at("2026-08-27T10:00:00Z"),
      }),
    ).toBe(false);
  });

  it("calculates only internal gaps and merges overlapping work", () => {
    const gaps = calculateGaps([
      { start: at("2026-08-27T08:00:00Z"), end: at("2026-08-27T09:00:00Z") },
      { start: at("2026-08-27T08:30:00Z"), end: at("2026-08-27T09:15:00Z") },
      { start: at("2026-08-27T09:30:00Z"), end: at("2026-08-27T10:00:00Z") },
      { start: at("2026-08-27T11:00:00Z"), end: at("2026-08-27T12:00:00Z") },
    ]);
    expect(gaps).toEqual([
      { start: at("2026-08-27T09:15:00Z"), end: at("2026-08-27T09:30:00Z") },
      { start: at("2026-08-27T10:00:00Z"), end: at("2026-08-27T11:00:00Z") },
    ]);
  });

  it("clips segments crossing either day boundary", () => {
    const window = {
      start: at("2026-08-27T03:00:00Z"),
      end: at("2026-08-28T03:00:00Z"),
    };
    expect(
      clipInterval(
        { start: at("2026-08-27T02:30:00Z"), end: at("2026-08-27T04:00:00Z") },
        window,
      ),
    ).toEqual({ start: window.start, end: at("2026-08-27T04:00:00Z") });
    expect(
      clipInterval(
        { start: at("2026-08-28T02:30:00Z"), end: at("2026-08-28T04:00:00Z") },
        window,
      ),
    ).toEqual({ start: at("2026-08-28T02:30:00Z"), end: window.end });
    expect(
      clipInterval(
        { start: at("2026-08-26T00:00:00Z"), end: at("2026-08-29T00:00:00Z") },
        window,
      ),
    ).toEqual(window);
  });

  it("uses IANA day boundaries across DST", () => {
    const normal = dayWindow("2026-03-07", "America/New_York");
    const spring = dayWindow("2026-03-08", "America/New_York");
    expect(intervalSeconds(normal)).toBe(24 * 3600);
    expect(intervalSeconds(spring)).toBe(23 * 3600);
    expect(
      zonedDateTimeToUtc(
        "2026-08-27T09:00:00",
        "America/Sao_Paulo",
      ).toISOString(),
    ).toBe("2026-08-27T12:00:00.000Z");
  });

  it("builds Monday-first week dates", () => {
    expect(startOfIsoWeek("2026-09-03")).toBe("2026-08-31");
    expect(weekDates("2026-09-03")).toEqual([
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
      "2026-09-05",
      "2026-09-06",
    ]);
    expect(addCalendarDays("2026-09-03", 7)).toBe("2026-09-10");
  });

  it("hides sub-minute idle sessions from the timeline", () => {
    expect(isDisplayableSession({ active: false, durationSeconds: 0 })).toBe(
      false,
    );
    expect(isDisplayableSession({ active: false, durationSeconds: 59 })).toBe(
      false,
    );
    expect(isDisplayableSession({ active: true, durationSeconds: 12 })).toBe(
      true,
    );
    expect(isDisplayableSession({ active: false, durationSeconds: 60 })).toBe(
      true,
    );
  });

  it("formats compact durations with seconds below one minute", () => {
    expect(formatCompactDuration(0)).toBe("0s");
    expect(formatCompactDuration(45)).toBe("45s");
    expect(formatCompactDuration(90)).toBe("1m");
    expect(formatCompactDuration(4980)).toBe("1h 23m");
    expect(formatWeekStripDuration(0)).toBe("—");
    expect(formatWeekStripDuration(59)).toBe("59s");
    expect(formatWeekStripDuration(3600)).toBe("1h");
  });

  it("converts overnight local times without inverting the interval", () => {
    const start = zonedDateTimeToUtc("2026-09-03T22:41:00", "UTC");
    const end = zonedDateTimeToUtc("2026-09-04T00:37:00", "UTC");
    expect(end.getTime() - start.getTime()).toBe((1 * 60 + 56) * 60 * 1000);
  });

  it("keeps date fields in day/month/year order", () => {
    expect(formatDateInput("2026-09-08")).toBe("08/09/2026");
    expect(parseDateInput("08/09/2026")).toBe("2026-09-08");
    expect(parseDateInput("09/09/2026")).toBe("2026-09-09");
  });

  it("calculates the screenshot interval as 1h24 instead of 30 days", () => {
    const startDate = parseDateInput("08/09/2026");
    const endDate = parseDateInput("09/09/2026");
    expect(startDate).toBe("2026-09-08");
    expect(endDate).toBe("2026-09-09");
    if (!startDate || !endDate) throw new Error("Expected valid dates");

    const start = zonedDateTimeToUtc(
      `${startDate}T23:34:00`,
      "America/Sao_Paulo",
    );
    const end = zonedDateTimeToUtc(`${endDate}T00:58:00`, "America/Sao_Paulo");
    expect(intervalSeconds({ start, end })).toBe(84 * 60);
  });

  it("rejects impossible displayed dates", () => {
    expect(parseDateInput("31/02/2026")).toBeNull();
    expect(parseDateInput("09/09/26")).toBeNull();
  });
});
