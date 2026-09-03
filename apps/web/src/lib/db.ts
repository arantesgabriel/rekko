import { createDatabaseClient, type DatabaseClient } from "@rekko/db";
import { parseServerEnv } from "@rekko/shared/env";

type DatabaseConnection = ReturnType<typeof createDatabaseClient>;

const globalForDatabase = globalThis as typeof globalThis & {
  __rekkoDatabaseConnection?: DatabaseConnection;
};

const connection =
  globalForDatabase.__rekkoDatabaseConnection ??
  createDatabaseClient(parseServerEnv(process.env).DATABASE_URL);

globalForDatabase.__rekkoDatabaseConnection = connection;

export const db: DatabaseClient = connection.db;
