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

export const onboardingInvitationSchema = invitationSchema.extend({
  role: z.enum(["MEMBER", "ADMIN"]),
});

export const completeOnboardingSchema = createWorkspaceSchema.extend({
  invitations: z
    .array(onboardingInvitationSchema)
    .max(10)
    .superRefine((invitations, context) => {
      const seen = new Set<string>();
      invitations.forEach((invitation, index) => {
        if (seen.has(invitation.email)) {
          context.addIssue({
            code: "custom",
            message: "Cada email deve aparecer apenas uma vez.",
            path: [index, "email"],
          });
        }
        seen.add(invitation.email);
      });
    }),
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
