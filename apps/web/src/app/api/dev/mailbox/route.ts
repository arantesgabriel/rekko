import { NextResponse } from "next/server";

import { listDevelopmentEmails } from "@/modules/auth/development-mailbox";

export async function GET() {
  if (process.env.NODE_ENV === "production")
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ emails: listDevelopmentEmails() });
}
