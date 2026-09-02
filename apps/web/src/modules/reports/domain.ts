export const reportCsvColumns = [
  "Data",
  "Colaborador",
  "Email",
  "Cargo",
  "Projeto",
  "Código da Demanda",
  "Demanda",
  "Início",
  "Fim",
  "Duração",
  "Duração em Horas",
  "Tipo de Atividade",
  "Descrição",
  "Origem",
] as const;

export type ReportCsvRow = Record<(typeof reportCsvColumns)[number], string>;

const formulaPrefix = /^[=+\-@]/;
const textColumns = new Set<(typeof reportCsvColumns)[number]>([
  "Colaborador",
  "Email",
  "Cargo",
  "Projeto",
  "Código da Demanda",
  "Demanda",
  "Tipo de Atividade",
  "Descrição",
  "Origem",
]);

export function formatReportDate(value: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(value);
  return (
    part(parts, "year") + "-" + part(parts, "month") + "-" + part(parts, "day")
  );
}

export function formatReportDisplayDate(value: Date, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).format(value);
}

export function formatReportDateTime(value: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(value);
  return `${formatReportDate(value, timezone)} ${part(parts, "hour")}:${part(parts, "minute")}`;
}

export function formatReportDisplayDateTime(value: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(value);
  return `${formatReportDisplayDate(value, timezone)} ${part(parts, "hour")}:${part(parts, "minute")}`;
}

export function formatReportInputDate(value: Date, timezone: string) {
  return formatReportDate(value, timezone);
}

export function formatReportInputTime(value: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone: timezone,
  }).formatToParts(value);
  return `${part(parts, "hour")}:${part(parts, "minute")}`;
}

export function formatReportDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatReportDecimalHours(totalSeconds: number) {
  return (Math.max(0, totalSeconds) / 3600).toFixed(4);
}

export function reportSourceLabel(source: "TIMER" | "MANUAL") {
  return source === "TIMER" ? "Timer" : "Manual";
}

export function protectCsvText(value: string) {
  return formulaPrefix.test(value) ? `'${value}` : value;
}

export function escapeCsvValue(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function buildReportCsv(rows: readonly ReportCsvRow[]) {
  const header = reportCsvColumns.map(escapeCsvValue).join(";");
  const body = rows
    .map((row) =>
      reportCsvColumns
        .map((column) =>
          escapeCsvValue(
            textColumns.has(column) ? protectCsvText(row[column]) : row[column],
          ),
        )
        .join(";"),
    )
    .join("\r\n");
  return `\uFEFF${body ? `${header}\r\n${body}` : header}\r\n`;
}

export function buildReportFilename(
  workspaceSlug: string,
  start: string,
  end: string,
) {
  const safeSlug = workspaceSlug
    .replace(/[^a-z0-9-]/gi, "-")
    .replace(/-+/g, "-");
  return `rekko-hours-${safeSlug || "workspace"}-${start}-${end}.csv`;
}

function part(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
) {
  return parts.find((item) => item.type === type)?.value ?? "";
}
