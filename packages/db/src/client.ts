import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { schema } from "./schema";

const DATABASE_POOL_MAX = 5;
const DATABASE_IDLE_TIMEOUT_SECONDS = 20;
const DATABASE_MAX_LIFETIME_SECONDS = 60 * 30;

export function createDatabaseClient(databaseUrl: string) {
  const queryClient = postgres(databaseUrl, {
    idle_timeout: DATABASE_IDLE_TIMEOUT_SECONDS,
    max: DATABASE_POOL_MAX,
    max_lifetime: DATABASE_MAX_LIFETIME_SECONDS,
    prepare: false,
  });

  return {
    db: drizzle(queryClient, { schema }),
    queryClient,
  };
}

export type DatabaseClient = ReturnType<typeof createDatabaseClient>["db"];
