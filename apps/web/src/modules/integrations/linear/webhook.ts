import { integrationEvent, linearConnection } from "@rekko/db";
import { parseServerEnv } from "@rekko/shared/env";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { reconcileLinearIssue } from "./service";
import { LinearWebhookError, verifyLinearWebhook } from "./webhook-security";

export { LinearWebhookError } from "./webhook-security";

const payloadSchema = z.object({
  action: z.string().min(1),
  data: z.object({
    id: z.string().min(1),
    updatedAt: z.string().datetime().optional(),
  }),
  organizationId: z.string().min(1),
  type: z.string().min(1),
});

export async function processLinearWebhook(input: {
  deliveryId: string;
  rawBody: string;
  signature: string | null;
  timestamp: string | null;
}) {
  const env = parseServerEnv(process.env);
  if (!env.LINEAR_WEBHOOK_SECRET)
    throw new LinearWebhookError("INVALID_SIGNATURE");
  verifyLinearWebhook({
    rawBody: input.rawBody,
    secret: env.LINEAR_WEBHOOK_SECRET,
    signature: input.signature,
    timestamp: input.timestamp,
  });
  let json: unknown;
  try {
    json = JSON.parse(input.rawBody);
  } catch {
    throw new LinearWebhookError("INVALID_PAYLOAD");
  }
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) throw new LinearWebhookError("INVALID_PAYLOAD");
  const payload = parsed.data;
  const [connection] = await db
    .select()
    .from(linearConnection)
    .where(
      and(
        eq(linearConnection.externalWorkspaceId, payload.organizationId),
        inArray(linearConnection.status, ["CONNECTED", "RECONNECT_REQUIRED"]),
      ),
    )
    .limit(1);
  if (!connection) return { duplicate: false, status: "IGNORED" as const };
  const sourceUpdatedAt = payload.data.updatedAt
    ? new Date(payload.data.updatedAt)
    : null;
  let eventId: string;
  try {
    const [event] = await db
      .insert(integrationEvent)
      .values({
        connectionId: connection.id,
        deliveryId: input.deliveryId,
        eventType: `${payload.type}.${payload.action}`,
        externalEntityId: payload.data.id,
        provider: "linear",
        sourceUpdatedAt,
        workspaceId: connection.workspaceId,
      })
      .returning({ id: integrationEvent.id });
    if (!event) throw new Error("Integration event insert returned no row");
    eventId = event.id;
  } catch (error) {
    if (isUniqueViolation(error))
      return { duplicate: true, status: "IGNORED" as const };
    throw error;
  }
  try {
    const status =
      payload.type.toLowerCase() === "issue"
        ? await reconcileLinearIssue({
            connection,
            externalIssueId: payload.data.id,
            sourceUpdatedAt,
          })
        : ("IGNORED" as const);
    await db
      .update(integrationEvent)
      .set({ processedAt: new Date(), status })
      .where(eq(integrationEvent.id, eventId));
    return { duplicate: false, status };
  } catch (error) {
    await db
      .update(integrationEvent)
      .set({ errorCode: "PROCESSING_FAILED", status: "FAILED" })
      .where(eq(integrationEvent.id, eventId));
    throw error;
  }
}

function isUniqueViolation(error: unknown): boolean {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  )
    return true;
  return typeof error === "object" && error !== null && "cause" in error
    ? isUniqueViolation((error as { cause?: unknown }).cause)
    : false;
}
