import "../../../../../../packages/db/src/root-environment";

import {
  auditLog,
  integrationEvent,
  linearConnection,
  project,
  user,
  workspace,
  workspaceMember,
  workItem,
} from "@rekko/db";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { createWorkspace } from "@/modules/workspaces/service";
import { FakeLinearGateway } from "./fake-gateway";
import { connectLinear, disconnectLinear, importLinearIssues } from "./service";

const suffix = crypto.randomUUID().slice(0, 8);
const users = {
  member: `linear-member-${suffix}`,
  owner: `linear-owner-${suffix}`,
};
const workspaceIds: string[] = [];

describe.sequential("Linear integration with PostgreSQL", () => {
  let slug = "";
  let workspaceId = "";
  let projectId = "";

  beforeAll(async () => {
    process.env.REKKO_ENCRYPTION_KEY_V1 = Buffer.alloc(32, 4).toString(
      "base64",
    );
    await db.insert(user).values([
      { id: users.owner, name: "Owner", email: `${users.owner}@rekko.test` },
      { id: users.member, name: "Member", email: `${users.member}@rekko.test` },
    ]);
    const created = await createWorkspace({
      name: `Linear ${suffix}`,
      timezone: "UTC",
      userId: users.owner,
    });
    slug = created.slug;
    workspaceId = created.id;
    workspaceIds.push(created.id);
    await db.insert(workspaceMember).values({
      role: "MEMBER",
      userId: users.member,
      workspaceId,
    });
  });

  afterAll(async () => {
    await db
      .delete(integrationEvent)
      .where(inArray(integrationEvent.workspaceId, workspaceIds));
    await db
      .delete(auditLog)
      .where(inArray(auditLog.workspaceId, workspaceIds));
    await db
      .delete(workItem)
      .where(inArray(workItem.workspaceId, workspaceIds));
    await db.delete(project).where(inArray(project.workspaceId, workspaceIds));
    await db
      .delete(linearConnection)
      .where(inArray(linearConnection.workspaceId, workspaceIds));
    await db
      .delete(workspaceMember)
      .where(inArray(workspaceMember.workspaceId, workspaceIds));
    await db.delete(workspace).where(inArray(workspace.id, workspaceIds));
    await db.delete(user).where(inArray(user.id, Object.values(users)));
  });

  it("connects for Owner, encrypts credentials and blocks Member management", async () => {
    await connectLinear({
      externalWorkspaceId: `external-${suffix}`,
      externalWorkspaceName: "Acme Linear",
      slug,
      tokens: {
        accessToken: "access-plaintext",
        expiresAt: new Date(Date.now() + 3_600_000),
        refreshToken: "refresh-plaintext",
        scopes: ["read"],
      },
      userId: users.owner,
    });
    const [stored] = await db
      .select()
      .from(linearConnection)
      .where(eq(linearConnection.workspaceId, workspaceId));
    expect(stored?.accessTokenCiphertext).not.toContain("access-plaintext");
    expect(stored?.refreshTokenCiphertext).not.toContain("refresh-plaintext");
    await expect(
      disconnectLinear({ slug, userId: users.member }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("imports a child with a context-only parent and lets Member add selected cards", async () => {
    const created = await importLinearIssues({
      gateway: new FakeLinearGateway(),
      issueIds: ["lin-child-a"],
      projectName: "Selective",
      slug,
      userId: users.owner,
    });
    projectId = created.projectId!;
    const initial = await db
      .select()
      .from(workItem)
      .where(eq(workItem.projectId, projectId));
    expect(initial).toHaveLength(2);
    expect(
      initial.find((item) => item.externalId === "lin-parent"),
    ).toMatchObject({
      isTrackable: false,
      parentWorkItemId: null,
    });
    expect(
      initial.find((item) => item.externalId === "lin-child-a"),
    ).toMatchObject({
      estimatedMinutes: 30,
      isTrackable: true,
    });
    await importLinearIssues({
      existingProjectId: projectId,
      gateway: new FakeLinearGateway(),
      issueIds: ["lin-standalone"],
      slug,
      userId: users.member,
    });
    expect(
      await db.select().from(workItem).where(eq(workItem.projectId, projectId)),
    ).toHaveLength(3);
  });

  it("prevents duplicate scope expansion and preserves projections on disconnect", async () => {
    await expect(
      importLinearIssues({
        existingProjectId: projectId,
        gateway: new FakeLinearGateway(),
        issueIds: ["lin-standalone"],
        slug,
        userId: users.member,
      }),
    ).rejects.toMatchObject({ code: "DUPLICATE_IMPORT" });
    await disconnectLinear({ slug, userId: users.owner });
    expect(
      await db.select().from(workItem).where(eq(workItem.projectId, projectId)),
    ).toHaveLength(3);
    const [connection] = await db
      .select()
      .from(linearConnection)
      .where(eq(linearConnection.workspaceId, workspaceId));
    expect(connection).toMatchObject({
      accessTokenCiphertext: null,
      refreshTokenCiphertext: null,
      status: "DISCONNECTED",
    });
  });
});
