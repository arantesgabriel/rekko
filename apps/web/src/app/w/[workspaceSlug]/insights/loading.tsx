import { InsightsSkeleton } from "@/components/insights/insights-skeleton";
import { PageContainer } from "@/components/ui/page-container";

export default function InsightsLoading() {
  return (
    <PageContainer width="wide">
      <InsightsSkeleton />
    </PageContainer>
  );
}
