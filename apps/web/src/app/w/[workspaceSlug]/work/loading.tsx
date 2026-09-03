import { DemandsSkeleton } from "@/components/demands/demands-skeleton";
import { PageContainer } from "@/components/ui/page-container";

export default function DemandsLoading() {
  return (
    <PageContainer width="lg">
      <DemandsSkeleton />
    </PageContainer>
  );
}
