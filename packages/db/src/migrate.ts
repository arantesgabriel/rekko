import "./root-environment";

import { fileURLToPath } from "node:url";

import { parseDatabaseEnv } from "@rekko/shared/env";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const env = parseDatabaseEnv(process.env);
const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));
const queryClient = postgres(env.DATABASE_URL, { max: 1, prepare: false });

try {
  await migrate(drizzle(queryClient), { migrationsFolder });
  process.stdout.write("Database migrations applied successfully.\n");
} finally {
  await queryClient.end();
}
