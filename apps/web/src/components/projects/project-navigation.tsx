import Link from "next/link";

import type { ProjectView } from "@/components/projects/project-format";

const tabs: { id: ProjectView; label: string }[] = [
  { id: "overview", label: "Visão geral" },
  { id: "demands", label: "Demandas" },
  { id: "activity", label: "Atividade" },
];

export function ProjectNavigation({
  current,
  hrefFor,
}: {
  current: ProjectView;
  hrefFor: (view: ProjectView) => string;
}) {
  return (
    <nav aria-label="Seções do projeto" className="project-nav">
      {tabs.map((tab) => {
        const active = tab.id === current;
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`project-nav__tab${active ? " is-active" : ""}`}
            href={hrefFor(tab.id)}
            key={tab.id}
            scroll={false}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
