import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";

export default function InsightsLoading() {
  return (
    <PageContainer width="lg">
      <PageHeader
        description="Veja onde seu tempo foi usado e compare o registrado com as estimativas disponíveis."
        title="Insights"
      />
      <div className="insights-skeleton" aria-label="Carregando insights">
        <div className="insights-skeleton__toolbar" />
        <div className="insights-skeleton__summary" />
        <div className="insights-skeleton__section" />
        <div className="insights-skeleton__section" />
      </div>
    </PageContainer>
  );
}
