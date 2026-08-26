import "./root-environment";

import { parseDatabaseEnv } from "@rekko/shared/env";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";

import { assertSeedAllowed } from "./seed-guard";
import { project, user, workspace, workspaceMember, workItem } from "./schema";

assertSeedAllowed(process.env.NODE_ENV, process.env.REKKO_SEED_ENV);

const env = parseDatabaseEnv(process.env);
const queryClient = postgres(env.DATABASE_URL, { max: 1, prepare: false });
const db = drizzle(queryClient);

try {
  const users = [
    { id: "seed-owner", name: "Olivia Owner", email: "owner@rekko.local" },
    { id: "seed-admin", name: "André Admin", email: "admin@rekko.local" },
    { id: "seed-member", name: "Marina Member", email: "member@rekko.local" },
  ];
  await db.insert(user).values(users).onConflictDoNothing();
  const [existing] = await db
    .select({ id: workspace.id })
    .from(workspace)
    .where(eq(workspace.slug, "rekko-demo"));
  const workspaceId =
    existing?.id ??
    (
      await db
        .insert(workspace)
        .values({
          createdByUserId: "seed-owner",
          name: "Rekko Demo",
          slug: "rekko-demo",
          timezone: "America/Sao_Paulo",
        })
        .returning({ id: workspace.id })
    )[0]?.id;
  if (!workspaceId) throw new Error("Seed Workspace was not created");
  await db
    .insert(workspaceMember)
    .values([
      { workspaceId, userId: "seed-owner", role: "OWNER", jobTitle: "Founder" },
      {
        workspaceId,
        userId: "seed-admin",
        role: "ADMIN",
        jobTitle: "Tech Lead",
      },
      {
        workspaceId,
        userId: "seed-member",
        role: "MEMBER",
        jobTitle: "Desenvolvedora Backend",
      },
    ])
    .onConflictDoNothing();
  const existingProjects = await db
    .select({ id: project.id })
    .from(project)
    .where(eq(project.workspaceId, workspaceId));
  if (existingProjects.length === 0) {
    const createdProjects = await db
      .insert(project)
      .values([
        {
          workspaceId,
          createdByUserId: "seed-owner",
          name: "AMBLA",
          description: "Produto e onboarding",
          estimatedMinutes: 2400,
          status: "ACTIVE",
        },
        {
          workspaceId,
          createdByUserId: "seed-owner",
          name: "AidCrusader",
          description: "Operações e plataforma",
          estimatedMinutes: 1560,
          status: "ACTIVE",
        },
      ])
      .returning({ id: project.id, name: project.name });
    const ambla = createdProjects.find((item) => item.name === "AMBLA")!;
    const aidCrusader = createdProjects.find(
      (item) => item.name === "AidCrusader",
    )!;
    const [authentication] = await db
      .insert(workItem)
      .values({
        workspaceId,
        projectId: ambla.id,
        title: "Authentication",
        status: "IN_PROGRESS",
        estimatedMinutes: 360,
      })
      .returning({ id: workItem.id });
    await db.insert(workItem).values([
      {
        workspaceId,
        projectId: ambla.id,
        title: "Login screen",
        status: "DONE",
        estimatedMinutes: 120,
        parentWorkItemId: authentication!.id,
      },
      {
        workspaceId,
        projectId: ambla.id,
        title: "Password recovery",
        status: "DONE",
        estimatedMinutes: 90,
        parentWorkItemId: authentication!.id,
      },
      {
        workspaceId,
        projectId: ambla.id,
        title: "Workspace onboarding",
        status: "IN_PROGRESS",
        estimatedMinutes: 240,
      },
      {
        workspaceId,
        projectId: ambla.id,
        title: "Project setup",
        status: "TODO",
        estimatedMinutes: 180,
      },
      {
        workspaceId,
        projectId: aidCrusader.id,
        title: "Campaign curation",
        status: "IN_PROGRESS",
        estimatedMinutes: 300,
      },
      {
        workspaceId,
        projectId: aidCrusader.id,
        title: "Queue reliability",
        status: "TODO",
        estimatedMinutes: 180,
      },
      {
        workspaceId,
        projectId: aidCrusader.id,
        title: "API regression tests",
        status: "TODO",
        estimatedMinutes: 240,
      },
    ]);
  }
  process.stdout.write(
    "Seeded Rekko Demo with people, Projects and Work Items.\n",
  );
} finally {
  await queryClient.end();
}
