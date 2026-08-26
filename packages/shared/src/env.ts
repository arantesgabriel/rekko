import { z } from "zod";

type EnvironmentInput = Record<string, string | undefined>;

const emptyStringToUndefined = z.literal("").transform(() => undefined);

const optionalUrl = z.union([z.url(), emptyStringToUndefined]).optional();

const databaseEnvSchema = z.object({
  DATABASE_URL: z.url().startsWith("postgresql://"),
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_POSTHOG_HOST: z.url().default("https://us.i.posthog.com"),
  NEXT_PUBLIC_POSTHOG_KEY: z
    .union([z.string().min(1), emptyStringToUndefined])
    .optional(),
  NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
});

const serverEnvSchema = databaseEnvSchema.extend({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  SENTRY_AUTH_TOKEN: z
    .union([z.string().min(1), emptyStringToUndefined])
    .optional(),
  SENTRY_DSN: optionalUrl,
  SENTRY_ORG: z.union([z.string().min(1), emptyStringToUndefined]).optional(),
  SENTRY_PROJECT: z
    .union([z.string().min(1), emptyStringToUndefined])
    .optional(),
});

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;
export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseDatabaseEnv(input: EnvironmentInput): DatabaseEnv {
  return databaseEnvSchema.parse(input);
}

export function parsePublicEnv(input: EnvironmentInput): PublicEnv {
  return publicEnvSchema.parse(input);
}

export function parseServerEnv(input: EnvironmentInput): ServerEnv {
  return serverEnvSchema.merge(publicEnvSchema).parse(input);
}
