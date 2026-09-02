import type { ReactNode } from "react";

export function SectionHeader({
  actions,
  description,
  id,
  title,
}: {
  actions?: ReactNode;
  description?: ReactNode;
  id?: string;
  title: ReactNode;
}) {
  return (
    <div className="section-header">
      <div className="section-header__copy">
        <h2 className="section-title" id={id}>
          {title}
        </h2>
        {description ? (
          <p className="section-description">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="section-header__actions">{actions}</div>
      ) : null}
    </div>
  );
}
