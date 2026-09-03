import { parseDatabaseEnv } from "@rekko/shared/env";
import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";

config({
  path: fileURLToPath(new URL("../../.env", import.meta.url)),
  quiet: true,
});

const env = parseDatabaseEnv(process.env);

export default defineConfig({
  dbCredentials: {
    url: env.DATABASE_MIGRATION_URL ?? env.DATABASE_URL,
  },
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./src/schema.ts",
  strict: true,
  verbose: true,
});
