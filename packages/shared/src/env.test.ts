import { describe, expect, it } from "vitest";

import { parsePublicEnv, parseServerEnv } from "./env";

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
});
