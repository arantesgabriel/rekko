import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ReportsView } from "@/components/reports/reports-view";
import { requireCoreSession } from "@/modules/auth/session";
import {
  getReportFilterOptions,
  getTimeReport,
} from "@/modules/reports/service";
import { parseReportQuery } from "@/modules/reports/schemas";

export const metadata = { title: "Relatórios" };

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workspaceSlug } = await params;
  const queryParams = await searchParams;
  const session = await requireCoreSession(`/w/${workspaceSlug}/reports`);
  const query = parseReportQuery(queryParams);
  const [data, options] = await Promise.all([
    getTimeReport({ userId: session.user.id, slug: workspaceSlug, query }),
    getReportFilterOptions({
      userId: session.user.id,
      slug: workspaceSlug,
      ...(query.projectId ? { projectId: query.projectId } : {}),
    }),
  ]);
  const exportParams = new URLSearchParams({ period: query.period });
  if (options.canViewWorkspace && query.userId)
    exportParams.set("userId", query.userId);
  if (query.projectId) exportParams.set("projectId", query.projectId);
  if (query.workItemId) exportParams.set("workItemId", query.workItemId);
  if (query.period === "custom") {
    if (query.start) exportParams.set("start", query.start);
    if (query.end) exportParams.set("end", query.end);
  }

  return (
    <PageContainer width="lg">
      <PageHeader
        description="Confira as horas por colaborador, projeto e demanda. O relatório usa a timezone do Workspace."
        title="Relatórios"
      />
      <ReportsView
        data={data}
        exportUrl={`/api/v1/workspaces/${workspaceSlug}/reports/csv?${exportParams.toString()}`}
        options={options}
        workspaceSlug={workspaceSlug}
      />
    </PageContainer>
  );
}
