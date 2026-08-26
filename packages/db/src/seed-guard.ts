export type SeedEnvironment = "local" | "test";

export function assertSeedAllowed(
  nodeEnvironment: string | undefined,
  seedEnvironment: string | undefined,
): asserts seedEnvironment is SeedEnvironment {
  if (nodeEnvironment === "production") {
    throw new Error("Database seed is disabled in production.");
  }

  if (seedEnvironment !== "local" && seedEnvironment !== "test") {
    throw new Error(
      "REKKO_SEED_ENV must be explicitly set to local or test before seeding.",
    );
  }
}
