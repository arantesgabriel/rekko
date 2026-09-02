import { InsightsView } from "@/components/insights/insights-view";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { requireCoreSession } from "@/modules/auth/session";
import { getInsights } from "@/modules/insights/service";
import { parseInsightsQuery } from "@/modules/insights/schemas";

export const metadata = { title: "Insights" };

export default async function InsightsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workspaceSlug } = await params;
  const query = await searchParams;
  const session = await requireCoreSession(`/w/${workspaceSlug}/insights`);
  const data = await getInsights({
    userId: session.user.id,
    slug: workspaceSlug,
    query: parseInsightsQuery(query),
  });

  return (
    <PageContainer width="lg">
      <PageHeader
        description="Veja onde seu tempo foi usado e compare o registrado com as estimativas disponíveis."
        title="Insights"
      />
      <InsightsView data={data} />
    </PageContainer>
  );
}
