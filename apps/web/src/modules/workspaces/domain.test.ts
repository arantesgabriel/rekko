import { describe, expect, it } from "vitest";

import {
  canManageRole,
  hasWorkspacePermission,
  invitationState,
  normalizeWorkspaceSlug,
  wouldRemoveLastOwner,
} from "./domain";

describe("workspace permission matrix", () => {
  it("keeps settings workspace-wide for Owner and Admin", () => {
    expect(hasWorkspacePermission("OWNER", "workspace:settings")).toBe(true);
    expect(hasWorkspacePermission("ADMIN", "workspace:settings")).toBe(true);
    expect(hasWorkspacePermission("MEMBER", "workspace:settings")).toBe(false);
  });

  it("limits corrections of another person's time to Owner", () => {
    expect(hasWorkspacePermission("OWNER", "time:correct")).toBe(true);
    expect(hasWorkspacePermission("ADMIN", "time:correct")).toBe(false);
    expect(hasWorkspacePermission("MEMBER", "time:correct")).toBe(false);
  });

  it("allows Owner and Admin to invite, but never Member", () => {
    expect(hasWorkspacePermission("OWNER", "invitation:manage")).toBe(true);
    expect(hasWorkspacePermission("ADMIN", "invitation:manage")).toBe(true);
    expect(hasWorkspacePermission("MEMBER", "invitation:manage")).toBe(false);
  });

  it("prevents Admin from creating or changing an Owner", () => {
    expect(
      canManageRole({
        actorRole: "ADMIN",
        currentRole: "MEMBER",
        nextRole: "OWNER",
      }),
    ).toBe(false);
    expect(
      canManageRole({
        actorRole: "ADMIN",
        currentRole: "OWNER",
        nextRole: "MEMBER",
      }),
    ).toBe(false);
    expect(
      canManageRole({
        actorRole: "ADMIN",
        currentRole: "MEMBER",
        nextRole: "ADMIN",
      }),
    ).toBe(true);
  });
});

describe("last Owner rule", () => {
  it("blocks removing or demoting the sole Owner", () => {
    expect(wouldRemoveLastOwner({ ownerCount: 1, currentRole: "OWNER" })).toBe(
      true,
    );
    expect(
      wouldRemoveLastOwner({
        ownerCount: 1,
        currentRole: "OWNER",
        nextRole: "ADMIN",
      }),
    ).toBe(true);
  });

  it("allows changes when another Owner remains", () => {
    expect(
      wouldRemoveLastOwner({
        ownerCount: 2,
        currentRole: "OWNER",
        nextRole: "MEMBER",
      }),
    ).toBe(false);
  });
});

describe("invitations", () => {
  const future = new Date("2026-09-02T12:00:00Z");
  const now = new Date("2026-08-26T12:00:00Z");

  it("derives every invitation state without redundant status storage", () => {
    expect(
      invitationState({
        acceptedAt: null,
        cancelledAt: null,
        expiresAt: future,
        now,
      }),
    ).toBe("PENDING");
    expect(
      invitationState({
        acceptedAt: now,
        cancelledAt: null,
        expiresAt: future,
        now,
      }),
    ).toBe("ACCEPTED");
    expect(
      invitationState({
        acceptedAt: null,
        cancelledAt: now,
        expiresAt: future,
        now,
      }),
    ).toBe("CANCELLED");
    expect(
      invitationState({
        acceptedAt: null,
        cancelledAt: null,
        expiresAt: now,
        now,
      }),
    ).toBe("EXPIRED");
  });
});

describe("workspace slug", () => {
  it("normalizes accents, separators and length predictably", () => {
    expect(normalizeWorkspaceSlug("  Minha Consultória 2026! ")).toBe(
      "minha-consultoria-2026",
    );
    expect(normalizeWorkspaceSlug("---")).toBe("workspace");
    expect(normalizeWorkspaceSlug("a".repeat(80))).toHaveLength(48);
  });
});
