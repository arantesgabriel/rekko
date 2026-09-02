import { PageContainer } from "@/components/ui/page-container";

export default function TodayLoading() {
  return (
    <PageContainer width="lg">
      <div
        className="today-skeleton"
        aria-label="Carregando seu dia"
        role="status"
      >
        <div className="today-skeleton__heading" aria-hidden="true" />
        <div className="today-skeleton__summary" aria-hidden="true" />
        <div className="today-skeleton__timeline" aria-hidden="true" />
      </div>
    </PageContainer>
  );
}
