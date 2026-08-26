import { createDatabaseClient, schema } from "@rekko/db";
import { parseServerEnv } from "@rekko/shared/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { createEmailService } from "./email-service";

const env = parseServerEnv(process.env);
const { db } = createDatabaseClient(env.DATABASE_URL);
const emailService = createEmailService({
  apiKey: env.RESEND_API_KEY,
  from: env.RESEND_FROM_EMAIL,
  production: env.NODE_ENV === "production",
});

const google =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {};

export const auth = betterAuth({
  appName: "Rekko",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema, usePlural: false }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: false,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 3600,
    sendResetPassword: async ({ user, url }) =>
      emailService.sendPasswordReset({
        email: user.email,
        name: user.name,
        url: replaceAuthPath(url, "/reset-password"),
      }),
  },
  emailVerification: {
    expiresIn: 60 * 60 * 24,
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) =>
      emailService.sendVerification({
        email: user.email,
        name: user.name,
        url: replaceAuthPath(url, "/verify-email"),
      }),
  },
  socialProviders: google,
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      allowDifferentEmails: false,
    },
  },
  rateLimit: {
    enabled: process.env.REKKO_E2E !== "true",
    window: 60,
    max: 10,
    storage: "database",
  },
  advanced: {
    cookiePrefix: "rekko",
    useSecureCookies: env.NODE_ENV === "production",
  },
  trustedOrigins: [
    env.NEXT_PUBLIC_APP_URL,
    env.BETTER_AUTH_URL,
    ...(env.NODE_ENV === "production" ? [] : ["http://127.0.0.1:3000"]),
  ],
});

function replaceAuthPath(url: string, path: string) {
  const parsed = new URL(url);
  const token = parsed.searchParams.get("token");
  const callbackURL = parsed.searchParams.get("callbackURL");
  const target = new URL(path, env.NEXT_PUBLIC_APP_URL);
  if (token) target.searchParams.set("token", token);
  if (callbackURL) target.searchParams.set("callbackURL", callbackURL);
  return target.toString();
}
