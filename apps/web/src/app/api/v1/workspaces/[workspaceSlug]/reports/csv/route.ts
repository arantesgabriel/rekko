import { NextResponse } from "next/server";

import { getCoreSession } from "@/modules/auth/session";
import { WorkspaceError } from "@/modules/workspaces/errors";
import { exportTimeReportCsv } from "@/modules/reports/service";
import { parseReportQuery } from "@/modules/reports/schemas";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  const session = await getCoreSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { workspaceSlug } = await params;
  const query = parseReportQuery(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  try {
    const result = await exportTimeReportCsv({
      userId: session.user.id,
      slug: workspaceSlug,
      query,
    });
    return new Response(result.csv, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Content-Type": "text/csv; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof WorkspaceError) {
      return NextResponse.json(
        { error: error.code === "FORBIDDEN" ? "forbidden" : "not_found" },
        { status: error.code === "FORBIDDEN" ? 403 : 404 },
      );
    }
    return NextResponse.json({ error: "export_failed" }, { status: 500 });
  }
}
