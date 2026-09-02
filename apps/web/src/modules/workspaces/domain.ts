export const workspaceRoles = ["OWNER", "ADMIN", "MEMBER"] as const;
export type WorkspaceRole = (typeof workspaceRoles)[number];

export const workspaceRoleLabel: Record<WorkspaceRole, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  MEMBER: "Membro",
};

export type WorkspacePermission =
  | "workspace:view"
  | "workspace:settings"
  | "invitation:manage"
  | "member:job-title"
  | "member:role"
  | "member:remove"
  | "project:manage"
  | "linear:manage"
  | "linear:import"
  | "time:correct";

const permissionMatrix: Record<WorkspaceRole, readonly WorkspacePermission[]> =
  {
    OWNER: [
      "workspace:view",
      "workspace:settings",
      "invitation:manage",
      "member:job-title",
      "member:role",
      "member:remove",
      "project:manage",
      "linear:manage",
      "linear:import",
      "time:correct",
    ],
    ADMIN: [
      "workspace:view",
      "workspace:settings",
      "invitation:manage",
      "member:job-title",
      "member:role",
      "member:remove",
      "project:manage",
      "linear:manage",
      "linear:import",
    ],
    MEMBER: ["workspace:view", "linear:import"],
  };

export function hasWorkspacePermission(
  role: WorkspaceRole,
  permission: WorkspacePermission,
) {
  return permissionMatrix[role].includes(permission);
}

export function canManageRole(input: {
  actorRole: WorkspaceRole;
  currentRole: WorkspaceRole;
  nextRole: WorkspaceRole;
}) {
  if (input.actorRole === "MEMBER") return false;
  if (input.actorRole === "ADMIN") {
    return input.currentRole !== "OWNER" && input.nextRole !== "OWNER";
  }
  return true;
}

export function wouldRemoveLastOwner(input: {
  ownerCount: number;
  currentRole: WorkspaceRole;
  nextRole?: WorkspaceRole;
}) {
  return (
    input.currentRole === "OWNER" &&
    input.nextRole !== "OWNER" &&
    input.ownerCount <= 1
  );
}

export function invitationState(input: {
  acceptedAt: Date | null;
  cancelledAt: Date | null;
  expiresAt: Date;
  now: Date;
}) {
  if (input.acceptedAt) return "ACCEPTED" as const;
  if (input.cancelledAt) return "CANCELLED" as const;
  if (input.expiresAt.getTime() <= input.now.getTime())
    return "EXPIRED" as const;
  return "PENDING" as const;
}

export function normalizeWorkspaceSlug(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "workspace";
}
