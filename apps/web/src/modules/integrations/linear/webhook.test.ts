import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { LinearWebhookError, verifyLinearWebhook } from "./webhook-security";

const secret = "a-secure-webhook-secret-with-32-chars";
const rawBody = JSON.stringify({ action: "update" });
const now = new Date("2026-08-27T12:00:00.000Z");
const signature = createHmac("sha256", secret).update(rawBody).digest("hex");

describe("Linear webhook verification", () => {
  it("accepts a current valid raw-body signature", () => {
    expect(() =>
      verifyLinearWebhook({
        now,
        rawBody,
        secret,
        signature,
        timestamp: String(now.getTime()),
      }),
    ).not.toThrow();
  });

  it("rejects an invalid signature", () => {
    expect(() =>
      verifyLinearWebhook({
        now,
        rawBody,
        secret,
        signature: "0".repeat(64),
        timestamp: String(now.getTime()),
      }),
    ).toThrowError(new LinearWebhookError("INVALID_SIGNATURE"));
  });

  it("rejects a replay outside the one-minute window", () => {
    expect(() =>
      verifyLinearWebhook({
        now,
        rawBody,
        secret,
        signature,
        timestamp: String(now.getTime() - 60_001),
      }),
    ).toThrowError(new LinearWebhookError("STALE"));
  });
});
