import { describe, expect, it } from "vitest";
import { parseEstimateFromDescription } from "./estimate-parser";

describe("parseEstimateFromDescription", () => {
  it.each([
    ["15m", 15],
    ["30m", 30],
    ["45m", 45],
    ["1h", 60],
    ["1h30", 90],
    ["1h 30m", 90],
    ["2h", 120],
    ["2h 15m", 135],
  ])("parses %s after the marker", (value, minutes) => {
    expect(
      parseEstimateFromDescription(`Contexto\n\nEstimativa\n${value}.`),
    ).toEqual({ found: true, minutes, rawValue: value });
  });

  it.each([null, "", "30m", "Estimativa\nnope", "Estimativa 30m"])(
    "returns null for invalid or missing marker: %s",
    (description) => {
      expect(parseEstimateFromDescription(description)).toEqual({
        found: false,
        minutes: null,
        rawValue: null,
      });
    },
  );

  it("accepts marker case and surrounding spacing", () => {
    expect(
      parseEstimateFromDescription("  ESTIMATIVA  \n  1h 30m  \n"),
    ).toMatchObject({
      found: true,
      minutes: 90,
    });
  });

  it("rejects multiple valid estimate blocks as ambiguous", () => {
    expect(
      parseEstimateFromDescription("Estimativa\n30m\n\nEstimativa\n1h"),
    ).toMatchObject({ found: false, minutes: null });
  });
});
