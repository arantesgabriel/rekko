import { createHmac, timingSafeEqual } from "node:crypto";

export class LinearWebhookError extends Error {
  constructor(
    readonly code: "INVALID_SIGNATURE" | "STALE" | "INVALID_PAYLOAD",
  ) {
    super(code);
  }
}

export function verifyLinearWebhook(input: {
  rawBody: string;
  signature: string | null;
  timestamp: string | null;
  secret: string;
  now?: Date;
}) {
  if (!input.signature || !input.timestamp)
    throw new LinearWebhookError("INVALID_SIGNATURE");
  const timestamp = Number(input.timestamp);
  const timestampMs = timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp;
  if (
    !Number.isFinite(timestampMs) ||
    Math.abs((input.now ?? new Date()).getTime() - timestampMs) > 60_000
  )
    throw new LinearWebhookError("STALE");
  const expected = createHmac("sha256", input.secret)
    .update(input.rawBody)
    .digest("hex");
  const provided = input.signature.toLowerCase();
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  )
    throw new LinearWebhookError("INVALID_SIGNATURE");
}
