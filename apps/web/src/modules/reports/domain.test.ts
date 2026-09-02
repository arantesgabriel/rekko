import { describe, expect, it } from "vitest";
import {
  buildReportCsv,
  buildReportFilename,
  formatReportDate,
  formatReportDateTime,
  formatReportDisplayDate,
  formatReportDisplayDateTime,
  formatReportDecimalHours,
  formatReportDuration,
  protectCsvText,
  reportCsvColumns,
  type ReportCsvRow,
} from "./domain";

const row: ReportCsvRow = {
  Data: "2026-09-01",
  Colaborador: "João da Silva",
  Email: "joao@example.com",
  Cargo: "Desenvolvedor Backend",
  Projeto: "AMBLA",
  "Código da Demanda": "AC-843",
  Demanda: "Cloudflare Turnstile",
  Início: "2026-09-01 08:30",
  Fim: "2026-09-01 10:55",
  Duração: "02:25",
  "Duração em Horas": "2.4167",
  "Tipo de Atividade": "",
  Descrição: 'Login, OAuth "Google"\nValidar callback',
  Origem: "Manual",
};

describe("reports domain", () => {
  it("formats duration in HH:mm and decimal hours", () => {
    expect(formatReportDuration(145 * 60)).toBe("02:25");
    expect(formatReportDecimalHours(145 * 60)).toBe("2.4167");
    expect(formatReportDuration(30 * 60)).toBe("00:30");
    expect(formatReportDecimalHours(30 * 60)).toBe("0.5000");
  });

  it("formats dates in the requested IANA timezone", () => {
    const value = new Date("2026-09-02T02:30:00.000Z");
    expect(formatReportDate(value, "America/Sao_Paulo")).toBe("2026-09-01");
    expect(formatReportDateTime(value, "America/Sao_Paulo")).toBe(
      "2026-09-01 23:30",
    );
    expect(formatReportDisplayDate(value, "America/Sao_Paulo")).toBe(
      "01/09/2026",
    );
    expect(formatReportDisplayDateTime(value, "America/Sao_Paulo")).toBe(
      "01/09/2026 23:30",
    );
  });

  it("quotes accents, delimiters, quotes and newlines as valid CSV", () => {
    const csv = buildReportCsv([row]);
    expect(
      csv.startsWith(
        "\uFEFF" + reportCsvColumns.map((column) => `"${column}"`).join(";"),
      ),
    ).toBe(true);
    expect(csv).toContain('"Login, OAuth ""Google""\nValidar callback"');
    expect(csv.split("\r\n")).toHaveLength(3);
    expect(Buffer.from(csv).subarray(0, 3).toString("hex")).toBe("efbbbf");
  });

  it("neutralizes spreadsheet formulas only in text fields", () => {
    expect(protectCsvText('=HYPERLINK("https://example.com")')).toBe(
      `'=HYPERLINK("https://example.com")`,
    );
    expect(protectCsvText("+tag@example.com")).toBe("'+tag@example.com");
    expect(protectCsvText("-0.5")).toBe("'-0.5");
    expect(buildReportCsv([{ ...row, Descrição: "=1+1" }])).toContain(
      '"\'=1+1"',
    );
  });

  it("creates a safe, useful filename", () => {
    expect(
      buildReportFilename("minha-consultoria", "2026-09-01", "2026-09-30"),
    ).toBe("rekko-hours-minha-consultoria-2026-09-01-2026-09-30.csv");
  });
});
