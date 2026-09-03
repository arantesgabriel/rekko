import { PageContainer } from "@/components/ui/page-container";

export default function HomeLoading() {
  return (
    <PageContainer width="lg">
      <div
        className="home-skeleton"
        aria-label="Carregando a Home"
        role="status"
      >
        <div className="home-skeleton__heading" aria-hidden="true" />
        <div className="home-skeleton__summary" aria-hidden="true" />
        <div className="home-skeleton__timeline" aria-hidden="true" />
      </div>
    </PageContainer>
  );
}
