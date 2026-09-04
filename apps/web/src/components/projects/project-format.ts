export function formatDuration(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  if (total < 60) return `${total}s`;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return [hours ? `${hours}h` : "", minutes ? `${minutes}m` : ""]
    .filter(Boolean)
    .join(" ");
}

export function formatTracked(seconds: number) {
  return seconds > 0 ? formatDuration(seconds) : "—";
}

export function formatUpdated(
  date: Date | null,
  timezone: string,
): { label: string; title?: string } {
  if (!date) return { label: "—" };
  const full = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(date);
  return { label: formatActivityDay(date, timezone) ?? "—", title: full };
}

export function formatActivityDay(date: Date | null, timezone: string) {
  if (!date) return null;
  const today = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).format(new Date());
  const value = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).format(date);
  if (today === value) return "Hoje";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: timezone,
  })
    .format(date)
    .replace(" de ", " ");
}

export function formatClock(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: timezone,
  }).format(date);
}

export type ProjectView = "overview" | "demands" | "activity";

export function parseProjectView(value: string | undefined): ProjectView {
  if (value === "demands" || value === "activity") return value;
  return "overview";
}
