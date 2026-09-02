import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";

export default function ReportsLoading() {
  return (
    <PageContainer width="lg">
      <PageHeader
        description="Confira as horas por colaborador, projeto e demanda."
        title="Relatórios"
      />
      <div className="reports-skeleton" aria-label="Carregando relatório">
        <div />
        <div />
        <div />
      </div>
    </PageContainer>
  );
}
