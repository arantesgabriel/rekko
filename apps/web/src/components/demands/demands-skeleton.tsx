export function DemandsSkeleton() {
  return (
    <div
      aria-label="Carregando demandas"
      className="demands-skeleton"
      role="status"
    >
      <div className="demands-skeleton__header" aria-hidden="true">
        <div>
          <span className="skeleton-line skeleton-line--title" />
          <span className="skeleton-line skeleton-line--copy" />
        </div>
        <div className="demands-skeleton__actions">
          <span className="skeleton-control" />
          <span className="skeleton-control skeleton-control--icon" />
        </div>
      </div>
      <div className="page-toolbar page-toolbar--surface" aria-hidden="true">
        <span className="skeleton-control skeleton-control--wide" />
        <span className="skeleton-control" />
        <span className="skeleton-control" />
      </div>
      <div className="demands-skeleton__list" aria-hidden="true">
        <span className="skeleton-line skeleton-line--section" />
        {Array.from({ length: 6 }).map((_, index) => (
          <span className="demands-skeleton__row" key={index} />
        ))}
      </div>
    </div>
  );
}
