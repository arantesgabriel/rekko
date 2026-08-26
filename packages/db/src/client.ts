import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { schema } from "./schema";

export function createDatabaseClient(databaseUrl: string) {
  const queryClient = postgres(databaseUrl, {
    max: 10,
    prepare: false,
  });

  return {
    db: drizzle(queryClient, { schema }),
    queryClient,
  };
}

export type DatabaseClient = ReturnType<typeof createDatabaseClient>["db"];
