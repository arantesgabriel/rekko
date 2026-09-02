import { describe, expect, it } from "vitest";

import { accountSettingsSchema, workspaceSettingsSchema } from "./schemas";

describe("settings schemas", () => {
  it("accepts IANA timezones and trims editable names", () => {
    expect(
      accountSettingsSchema.parse({
        name: "  Gabriel  ",
        timezone: "America/Sao_Paulo",
      }),
    ).toEqual({ name: "Gabriel", timezone: "America/Sao_Paulo" });
  });

  it("rejects fake timezone values", () => {
    expect(
      workspaceSettingsSchema.safeParse({
        name: "Rekko",
        timezone: "GMT-3",
      }).success,
    ).toBe(false);
  });
});
