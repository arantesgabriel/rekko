import "./root-environment";

import { parseDatabaseEnv } from "@rekko/shared/env";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";

import { assertSeedAllowed } from "./seed-guard";
import { user, workspace, workspaceMember } from "./schema";

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
  process.stdout.write("Seeded Rekko Demo with Owner, Admin and Member.\n");
} finally {
  await queryClient.end();
}
