import type { ReactNode } from "react";

export function PageContainer({
  children,
  width = "default",
}: {
  children: ReactNode;
  width?: "default" | "narrow" | "wide" | "sm" | "md" | "lg" | "full";
}) {
  return (
    <div className={`page-container page-container--${width}`}>{children}</div>
  );
}
