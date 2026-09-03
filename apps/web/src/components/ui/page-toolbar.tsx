import type { ReactNode } from "react";

export function PageToolbar({
  children,
  label,
  surface = false,
}: {
  children: ReactNode;
  label: string;
  surface?: boolean;
}) {
  return (
    <section
      aria-label={label}
      className={`page-toolbar${surface ? " page-toolbar--surface" : ""}`}
    >
      {children}
    </section>
  );
}
