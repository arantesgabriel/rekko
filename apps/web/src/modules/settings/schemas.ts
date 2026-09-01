import { z } from "zod";

import { isIanaTimezone } from "@/modules/workspaces/schemas";

const settingsFields = {
  name: z.string().trim().min(2).max(80),
  timezone: z.string().trim().min(1).max(80).refine(isIanaTimezone),
};

export const accountSettingsSchema = z.object(settingsFields);
export const workspaceSettingsSchema = z.object(settingsFields);
