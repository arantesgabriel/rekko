import { z } from "zod";

export const ownTimeEntryIntervalSchema = z.object({
  startDate: z.iso.date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endDate: z.iso.date(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export const manualTimeInputSchema = z.object({
  entryId: z
    .string()
    .trim()
    .transform((value) => value || null)
    .pipe(z.uuid().nullable()),
  date: z.iso.date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  projectId: z.uuid(),
  workItemId: z.uuid(),
  description: z
    .string()
    .trim()
    .max(2_000)
    .transform((value) => value || null),
});
