import { z } from "zod";

import { parseEstimate, projectStatuses, workItemStatuses } from "./domain";

const estimate = z.string().transform((value, context) => {
  const parsed = parseEstimate(value);
  if (parsed === undefined) {
    context.addIssue({ code: "custom", message: "Estimativa inválida." });
    return z.NEVER;
  }
  return parsed;
});

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null);

export const projectInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: optionalText(2_000),
  status: z.enum(projectStatuses),
  estimate: estimate,
});

export const workItemInputSchema = z.object({
  title: z.string().trim().min(2).max(180),
  description: optionalText(4_000),
  status: z.enum(workItemStatuses),
  estimate: estimate,
  parentWorkItemId: z
    .string()
    .trim()
    .transform((value) => value || null)
    .pipe(z.uuid().nullable()),
});
