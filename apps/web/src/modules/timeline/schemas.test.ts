import { describe, expect, it } from "vitest";

import { manualTimeInputSchema } from "./schemas";

const validInput = {
  entryId: "",
  date: "2026-09-06",
  startDate: "2026-09-06",
  startTime: "22:00",
  endDate: "2026-09-07",
  endTime: "01:00",
  projectId: "00000000-0000-4000-8000-000000000001",
  workItemId: "00000000-0000-4000-8000-000000000002",
  description: "",
};

describe("manual time input", () => {
  it("accepts explicit start and end dates", () => {
    expect(manualTimeInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("keeps the legacy single-date shape compatible", () => {
    const { startDate, endDate, ...legacyInput } = validInput;
    void startDate;
    void endDate;
    expect(manualTimeInputSchema.safeParse(legacyInput).success).toBe(true);
  });

  it("requires both explicit dates when one is provided", () => {
    const { endDate, ...incompleteInput } = validInput;
    void endDate;
    expect(manualTimeInputSchema.safeParse(incompleteInput).success).toBe(
      false,
    );
  });
});
