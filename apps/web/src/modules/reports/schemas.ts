import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const reportQuerySchema = z
  .object({
    period: z
      .enum(["today", "this_week", "last_week", "this_month", "custom"])
      .default("this_week"),
    userId: z.string().trim().min(1).max(128).optional(),
    projectId: z.uuid().optional(),
    workItemId: z.uuid().optional(),
    start: dateOnly.optional(),
    end: dateOnly.optional(),
    page: z.coerce.number().int().min(1).max(10_000).default(1),
  })
  .superRefine((value, context) => {
    if (value.period === "custom" && (!value.start || !value.end)) {
      context.addIssue({
        code: "custom",
        message: "Custom period requires a start and end date",
        path: ["start"],
      });
    }
    if (value.start && value.end && value.start > value.end) {
      context.addIssue({
        code: "custom",
        message: "Start date must not be after end date",
        path: ["end"],
      });
    }
  });

export type ReportQuery = z.infer<typeof reportQuerySchema>;

export function parseReportQuery(
  input: Record<string, string | string[] | undefined>,
): ReportQuery {
  const value = (key: string) =>
    typeof input[key] === "string" ? input[key] : undefined;
  const optionalValue = (key: string) => {
    const result = value(key);
    return result && result !== "all" ? result : undefined;
  };
  const parsed = reportQuerySchema.safeParse({
    period: value("period"),
    userId: optionalValue("userId"),
    projectId: optionalValue("projectId"),
    workItemId: optionalValue("workItemId"),
    start: value("start"),
    end: value("end"),
    page: value("page"),
  });
  if (parsed.success) return parsed.data;
  return { page: 1, period: "this_week" };
}
