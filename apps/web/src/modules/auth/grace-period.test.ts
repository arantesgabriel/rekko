import { describe, expect, it } from "vitest";
import { getVerificationAccess } from "./grace-period";

const createdAt = new Date("2026-08-20T12:00:00.000Z");
const at = (hours: number) => new Date(createdAt.getTime() + hours * 3_600_000);
const access = (hours: number, emailVerified = false) =>
  getVerificationAccess({
    createdAt,
    emailVerified,
    graceHours: 72,
    now: at(hours),
  });

describe("email verification grace period", () => {
  it.each([
    [0, "allowed"],
    [71.99, "allowed"],
    [72, "blocked"],
    [72.01, "blocked"],
  ] as const)("at %sh returns %s", (hours, expected) =>
    expect(access(hours)).toBe(expected),
  );
  it("always allows a verified email", () =>
    expect(access(240, true)).toBe("verified"));
  it("treats a provider-verified Google account as verified", () =>
    expect(access(240, true)).toBe("verified"));
});
