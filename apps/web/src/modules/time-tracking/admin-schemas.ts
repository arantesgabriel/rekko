import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeOnly = z.string().regex(/^\d{2}:\d{2}$/);

export const timeEntryCorrectionSchema = z.object({
  date: dateOnly,
  startTime: timeOnly,
  endTime: timeOnly,
  projectId: z.uuid(),
  workItemId: z.uuid(),
  description: z
    .string()
    .trim()
    .max(2000)
    .transform((value) => value || null),
});
