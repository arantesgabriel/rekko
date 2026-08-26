import { z } from "zod";

import { workspaceRoles } from "./domain";

const jobTitle = z
  .string()
  .trim()
  .max(100)
  .transform((value) => value || null);

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  timezone: z.string().trim().min(1).max(80).refine(isIanaTimezone),
});

export const invitationSchema = z.object({
  email: z.email().trim().toLowerCase(),
  role: z.enum(workspaceRoles),
  jobTitle,
});

export const roleSchema = z.object({ role: z.enum(workspaceRoles) });
export const jobTitleSchema = z.object({ jobTitle });

export function isIanaTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return value.includes("/") || value === "UTC";
  } catch {
    return false;
  }
}
