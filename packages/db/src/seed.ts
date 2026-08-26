import "./root-environment";

import { parseDatabaseEnv } from "@rekko/shared/env";
import postgres from "postgres";

import { assertSeedAllowed } from "./seed-guard";

assertSeedAllowed(process.env.NODE_ENV, process.env.REKKO_SEED_ENV);

const env = parseDatabaseEnv(process.env);
const queryClient = postgres(env.DATABASE_URL, { max: 1, prepare: false });

try {
  await queryClient`select 1`;
  process.stdout.write(
    "Seed connection verified. Phase 0 has no domain data to insert.\n",
  );
} finally {
  await queryClient.end();
}
