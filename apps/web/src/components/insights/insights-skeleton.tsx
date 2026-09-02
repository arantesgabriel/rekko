export function InsightsSkeleton() {
  return (
    <div
      className="insights-skeleton"
      aria-label="Carregando insights"
      role="status"
    >
      <div className="insights-skeleton__header" aria-hidden="true">
        <div>
          <span className="insights-skeleton__line is-short" />
          <span className="insights-skeleton__line is-title" />
          <span className="insights-skeleton__line is-copy" />
        </div>
        <span className="insights-skeleton__filters" />
      </div>
      <div className="insights-skeleton__kpis" aria-hidden="true">
        {[1, 2, 3, 4].map((item) => (
          <span key={item} />
        ))}
      </div>
      <div className="insights-skeleton__primary" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="insights-skeleton__secondary" aria-hidden="true">
        <span />
        <span />
      </div>
      <span className="insights-skeleton__comparison" aria-hidden="true" />
    </div>
  );
}
