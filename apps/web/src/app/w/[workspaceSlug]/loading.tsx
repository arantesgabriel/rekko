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
        <div className="home-skeleton__week" aria-hidden="true" />
        <div className="home-skeleton__layout" aria-hidden="true">
          <div>
            <div className="home-skeleton__summary" />
            <div className="home-skeleton__timeline" />
          </div>
          <div className="home-skeleton__side" />
        </div>
      </div>
    </PageContainer>
  );
}
