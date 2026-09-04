export function ProjectsSkeleton({ detail = false }: { detail?: boolean }) {
  if (detail) {
    return (
      <div
        aria-label="Carregando projeto"
        className="project-detail-skeleton"
        role="status"
      >
        <div className="project-detail-skeleton__header" aria-hidden="true">
          <div>
            <span className="skeleton-line skeleton-line--title" />
            <span className="skeleton-line skeleton-line--copy" />
            <span className="skeleton-line skeleton-line--meta" />
          </div>
          <span className="skeleton-control" />
        </div>
        <div className="project-detail-skeleton__nav" aria-hidden="true">
          <span className="skeleton-line skeleton-line--meta" />
          <span className="skeleton-line skeleton-line--meta" />
          <span className="skeleton-line skeleton-line--meta" />
        </div>
        <div className="project-detail-skeleton__summary" aria-hidden="true">
          <span className="skeleton-line skeleton-line--metric" />
          <span className="skeleton-line skeleton-line--metric" />
        </div>
        <div className="project-detail-skeleton__demands" aria-hidden="true">
          <span className="skeleton-line skeleton-line--section" />
          {Array.from({ length: 4 }).map((_, index) => (
            <span className="project-detail-skeleton__row" key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      aria-label="Carregando projetos"
      className="projects-skeleton"
      role="status"
    >
      <div className="projects-skeleton__header" aria-hidden="true">
        <div>
          <span className="skeleton-line skeleton-line--title" />
          <span className="skeleton-line skeleton-line--copy" />
        </div>
        <div className="projects-skeleton__actions">
          <span className="skeleton-control" />
          <span className="skeleton-control" />
        </div>
      </div>
      <div className="project-grid" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="project-card project-card--skeleton" key={index}>
            <div className="project-card__top">
              <span className="skeleton-line skeleton-line--meta" />
              <span className="skeleton-pill" />
            </div>
            <span className="skeleton-line skeleton-line--card-title" />
            <div className="project-card__stats">
              {Array.from({ length: 3 }).map((__, statIndex) => (
                <div className="project-card__stat" key={statIndex}>
                  <span className="skeleton-line skeleton-line--meta" />
                  <span className="skeleton-line skeleton-line--metric" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
