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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.posthog.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.posthog.com https://*.sentry.io; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
        ],
      },
    ];
  },
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
