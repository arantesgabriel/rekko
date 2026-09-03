import { describe, expect, it } from "vitest";

import { parseDatabaseEnv, parsePublicEnv, parseServerEnv } from "./env";

describe("environment validation", () => {
  it("applies safe public defaults", () => {
    expect(parsePublicEnv({})).toEqual({
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_POSTHOG_HOST: "https://us.i.posthog.com",
    });
  });

  it("rejects a missing database URL", () => {
    expect(() => parseServerEnv({ NODE_ENV: "test" })).toThrow();
  });

  it("accepts the documented local environment", () => {
    expect(
      parseServerEnv({
        DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:55322/postgres",
        NODE_ENV: "development",
      }),
    ).toMatchObject({
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });
  });

  it("accepts a separate migration database URL", () => {
    expect(
      parseDatabaseEnv({
        DATABASE_MIGRATION_URL:
          "postgresql://postgres:postgres@127.0.0.1:55322/postgres",
        DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:6543/postgres",
      }),
    ).toMatchObject({
      DATABASE_MIGRATION_URL:
        "postgresql://postgres:postgres@127.0.0.1:55322/postgres",
    });
  });

  it("allows an immediate grace guard only outside production", () => {
    expect(
      parseServerEnv({
        DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:55322/postgres",
        EMAIL_VERIFICATION_GRACE_HOURS: "0",
        NODE_ENV: "test",
      }).EMAIL_VERIFICATION_GRACE_HOURS,
    ).toBe(0);
    expect(() =>
      parseServerEnv({
        DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:55322/postgres",
        EMAIL_VERIFICATION_GRACE_HOURS: "0",
        NODE_ENV: "production",
      }),
    ).toThrow("must be 72 in production");
  });

  it("keeps local grace overrides compatible and enforces production policy", () => {
    expect(
      parseServerEnv({
        DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:55322/postgres",
        EMAIL_VERIFICATION_GRACE_HOURS: "876000",
        NODE_ENV: "development",
      }).EMAIL_VERIFICATION_GRACE_HOURS,
    ).toBe(876000);
    expect(() =>
      parseServerEnv({
        DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:55322/postgres",
        EMAIL_VERIFICATION_GRACE_HOURS: "876000",
        NODE_ENV: "production",
      }),
    ).toThrow("must be 72 in production");
  });
});
