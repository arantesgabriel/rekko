import type { ReactNode } from "react";

export function EmptyState({
  actions,
  description,
  title,
}: {
  actions?: ReactNode;
  description: ReactNode;
  title: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="segment-mark segment-mark--brand" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <h2 className="section-title">{title}</h2>
      <p>{description}</p>
      {actions}
    </div>
  );
}
