export type Interval = { start: Date; end: Date };

export function intervalsOverlap(a: Interval, b: Interval) {
  return a.start < b.end && a.end > b.start;
}

export function clipInterval(
  interval: Interval,
  window: Interval,
): Interval | null {
  const start = new Date(
    Math.max(interval.start.getTime(), window.start.getTime()),
  );
  const end = new Date(Math.min(interval.end.getTime(), window.end.getTime()));
  return start < end ? { start, end } : null;
}

export function intervalSeconds(interval: Interval) {
  return Math.max(
    0,
    Math.floor((interval.end.getTime() - interval.start.getTime()) / 1000),
  );
}

export function calculateGaps(intervals: readonly Interval[]): Interval[] {
  if (intervals.length < 2) return [];
  const sorted = [...intervals].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  const gaps: Interval[] = [];
  let end = sorted[0]!.end;
  for (const interval of sorted.slice(1)) {
    if (interval.start > end) gaps.push({ start: end, end: interval.start });
    if (interval.end > end) end = interval.end;
  }
  return gaps;
}

function partsInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value])) as {
    year: string;
    month: string;
    day: string;
    hour: string;
    minute: string;
    second: string;
  };
}

export function isValidTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

/** Converts a local wall-clock value in an IANA timezone to its UTC instant. */
export function zonedDateTimeToUtc(local: string, timezone: string) {
  if (!isValidTimezone(timezone)) throw new RangeError("Invalid timezone");
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    local,
  );
  if (!match) throw new RangeError("Invalid local date time");
  const [, y, mo, d, h, mi, s = "00"] = match;
  const target = Date.UTC(+y!, +mo! - 1, +d!, +h!, +mi!, +s);
  let result = new Date(target);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const p = partsInTimezone(result, timezone);
    const represented = Date.UTC(
      +p.year,
      +p.month - 1,
      +p.day,
      +p.hour,
      +p.minute,
      +p.second,
    );
    result = new Date(result.getTime() + target - represented);
  }
  const p = partsInTimezone(result, timezone);
  if (
    `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}` !==
    `${y}-${mo}-${d}T${h}:${mi}:${s}`
  )
    throw new RangeError("Local time does not exist in timezone");
  return result;
}

export function dayWindow(date: string, timezone: string): Interval {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new RangeError("Invalid date");
  const noon = zonedDateTimeToUtc(`${date}T12:00:00`, timezone);
  const nextParts = partsInTimezone(
    new Date(noon.getTime() + 18 * 60 * 60 * 1000),
    timezone,
  );
  const nextDate = `${nextParts.year}-${nextParts.month}-${nextParts.day}`;
  return {
    start: zonedDateTimeToUtc(`${date}T00:00:00`, timezone),
    end: zonedDateTimeToUtc(`${nextDate}T00:00:00`, timezone),
  };
}

export function dateInTimezone(date: Date, timezone: string) {
  const p = partsInTimezone(date, timezone);
  return `${p.year}-${p.month}-${p.day}`;
}

export function clockTimeInTimezone(date: Date, timezone: string) {
  const p = partsInTimezone(date, timezone);
  return `${p.hour}:${p.minute}`;
}

export function localDateTimeToUtc(
  date: string,
  time: string,
  timezone: string,
) {
  return zonedDateTimeToUtc(`${date}T${time}:00`, timezone);
}

/** Calendar-day arithmetic for `YYYY-MM-DD` values (noon UTC, no DST edge). */
export function addCalendarDays(date: string, amount: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new RangeError("Invalid date");
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

export function startOfIsoWeek(date: string) {
  const value = new Date(`${date}T12:00:00.000Z`);
  const day = value.getUTCDay();
  const delta = day === 0 ? -6 : 1 - day;
  return addCalendarDays(date, delta);
}

export function weekDates(date: string) {
  const start = startOfIsoWeek(date);
  return Array.from({ length: 7 }, (_, index) => addCalendarDays(start, index));
}

/** Same display floor as Insights: sub-minute noise is not a work session. */
export const MIN_TIMELINE_SESSION_SECONDS = 60;

export function isDisplayableSession(block: {
  active: boolean;
  durationSeconds: number;
}) {
  return block.active || block.durationSeconds >= MIN_TIMELINE_SESSION_SECONDS;
}

export function formatCompactDuration(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  if (total < 60) return `${total}s`;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return [hours ? `${hours}h` : "", minutes ? `${minutes}m` : ""]
    .filter(Boolean)
    .join(" ");
}

export function formatWeekStripDuration(seconds: number) {
  return Math.floor(Math.max(0, seconds)) <= 0
    ? "—"
    : formatCompactDuration(seconds);
}
