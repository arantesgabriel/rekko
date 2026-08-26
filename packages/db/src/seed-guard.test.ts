import { describe, expect, it } from "vitest";

import { assertSeedAllowed } from "./seed-guard";

describe("seed environment guard", () => {
  it("allows local and test environments", () => {
    expect(() => assertSeedAllowed("development", "local")).not.toThrow();
    expect(() => assertSeedAllowed("test", "test")).not.toThrow();
  });

  it("rejects production even when a seed environment is supplied", () => {
    expect(() => assertSeedAllowed("production", "test")).toThrow(
      "disabled in production",
    );
  });

  it("requires an explicit seed environment", () => {
    expect(() => assertSeedAllowed("development", undefined)).toThrow(
      "REKKO_SEED_ENV",
    );
  });
});
