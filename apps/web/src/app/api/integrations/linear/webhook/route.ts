import { NextResponse } from "next/server";

import {
  LinearWebhookError,
  processLinearWebhook,
} from "@/modules/integrations/linear/webhook";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const deliveryId = request.headers.get("linear-delivery");
  if (!deliveryId)
    return NextResponse.json({ error: "invalid_webhook" }, { status: 400 });
  try {
    const result = await processLinearWebhook({
      deliveryId,
      rawBody,
      signature: request.headers.get("linear-signature"),
      timestamp: request.headers.get("linear-timestamp"),
    });
    return NextResponse.json({ accepted: true, ...result });
  } catch (error) {
    if (error instanceof LinearWebhookError)
      return NextResponse.json(
        { error: "invalid_webhook" },
        { status: error.code === "STALE" ? 408 : 401 },
      );
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
}
