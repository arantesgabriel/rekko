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
  BETTER_AUTH_SECRET: z
    .string()
    .min(32)
    .default("local-development-secret-change-me-now"),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  EMAIL_VERIFICATION_GRACE_HOURS: z.coerce
    .number()
    .int()
    .nonnegative()
    .default(72),
  GOOGLE_CLIENT_ID: z
    .union([z.string().min(1), emptyStringToUndefined])
    .optional(),
  GOOGLE_CLIENT_SECRET: z
    .union([z.string().min(1), emptyStringToUndefined])
    .optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  RESEND_API_KEY: z
    .union([z.string().min(1), emptyStringToUndefined])
    .optional(),
  RESEND_FROM_EMAIL: z
    .string()
    .refine(
      (value) =>
        z.email().safeParse(value).success ||
        /^[^<>]+<[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+>$/.test(value),
      "Invalid email address or sender address",
    )
    .default("Rekko <onboarding@resend.dev>"),
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
export type ServerEnv = z.infer<typeof serverEnvSchema> & PublicEnv;

export function parseDatabaseEnv(input: EnvironmentInput): DatabaseEnv {
  return databaseEnvSchema.parse(input);
}

export function parsePublicEnv(input: EnvironmentInput): PublicEnv {
  return publicEnvSchema.parse(input);
}

export function parseServerEnv(input: EnvironmentInput): ServerEnv {
  const result = serverEnvSchema.merge(publicEnvSchema).parse(input);
  if (
    result.NODE_ENV === "production" &&
    result.EMAIL_VERIFICATION_GRACE_HOURS !== 72
  ) {
    throw new Error("EMAIL_VERIFICATION_GRACE_HOURS must be 72 in production");
  }
  return result;
}
