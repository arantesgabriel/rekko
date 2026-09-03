import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  drizzle: vi.fn(() => ({})),
  postgres: vi.fn(() => ({ end: vi.fn() })),
}));

vi.mock("drizzle-orm/postgres-js", () => ({ drizzle: mocks.drizzle }));
vi.mock("postgres", () => ({ default: mocks.postgres }));

import { createDatabaseClient } from "./client";

describe("createDatabaseClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a bounded pool with idle connection recycling", () => {
    const databaseUrl =
      "postgresql://postgres:postgres@127.0.0.1:55322/postgres";

    createDatabaseClient(databaseUrl);

    expect(mocks.postgres).toHaveBeenCalledWith(databaseUrl, {
      idle_timeout: 20,
      max: 5,
      max_lifetime: 60 * 30,
      prepare: false,
    });
  });
});
