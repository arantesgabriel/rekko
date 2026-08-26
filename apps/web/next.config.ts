import { loadEnvConfig } from "@next/env";
import { parseServerEnv } from "@rekko/shared/env";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import { basename, dirname, resolve } from "node:path";

const currentWorkingDirectory = process.cwd();
const runsFromWebWorkspace =
  basename(currentWorkingDirectory) === "web" &&
  basename(dirname(currentWorkingDirectory)) === "apps";
const repositoryRoot = runsFromWebWorkspace
  ? resolve(currentWorkingDirectory, "../..")
  : currentWorkingDirectory;
const environment = loadEnvConfig(
  repositoryRoot,
  process.env.NODE_ENV !== "production",
  console,
  true,
).combinedEnv;

parseServerEnv(environment);

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@rekko/db", "@rekko/shared"],
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  ...(process.env.SENTRY_AUTH_TOKEN
    ? { authToken: process.env.SENTRY_AUTH_TOKEN }
    : {}),
  ...(process.env.SENTRY_ORG ? { org: process.env.SENTRY_ORG } : {}),
  ...(process.env.SENTRY_PROJECT
    ? { project: process.env.SENTRY_PROJECT }
    : {}),
});
