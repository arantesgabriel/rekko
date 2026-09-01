import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const insightsQuerySchema = z
  .object({
    period: z
      .enum(["today", "this_week", "last_week", "this_month", "custom"])
      .default("this_week"),
    projectId: z.uuid().optional(),
    start: dateOnly.optional(),
    end: dateOnly.optional(),
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

export type InsightsQuery = z.infer<typeof insightsQuerySchema>;

export function parseInsightsQuery(
  input: Record<string, string | string[] | undefined>,
): InsightsQuery {
  const value = (key: string) =>
    typeof input[key] === "string" ? input[key] : undefined;
  const projectId = value("projectId");
  const parsed = insightsQuerySchema.safeParse({
    period: value("period"),
    projectId: projectId === "all" ? undefined : projectId,
    start: value("start"),
    end: value("end"),
  });
  if (parsed.success) return parsed.data;
  return { period: "this_week" };
}
