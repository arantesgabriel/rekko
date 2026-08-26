import { createDatabaseClient } from "@rekko/db";
import { parseServerEnv } from "@rekko/shared/env";

const connection = createDatabaseClient(
  parseServerEnv(process.env).DATABASE_URL,
);

export const db = connection.db;
