"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { DemandDrawer } from "@/components/demands/demand-drawer";
import { ProjectActivity } from "@/components/projects/project-activity";
import { ProjectDemandsPanel } from "@/components/projects/project-demands-panel";
import { ProjectDrawer } from "@/components/projects/project-drawer";
import {
  parseProjectView,
  type ProjectView,
} from "@/components/projects/project-format";
import { ProjectHeader } from "@/components/projects/project-header";
import { ProjectNavigation } from "@/components/projects/project-navigation";
import { ProjectOverview } from "@/components/projects/project-overview";
import { PageContainer } from "@/components/ui/page-container";
import type {
  DemandListItem,
  ProjectListItem,
  ProjectSummary,
} from "@/modules/projects/service";

type ProjectDetail = Pick<
  ProjectListItem,
  "id" | "name" | "description" | "source" | "status" | "estimatedMinutes"
> & { archivedAt: Date | null };

function tabHref(
  slug: string,
  projectId: string,
  view: ProjectView,
  filter: { kind: string; query: string; status: string },
) {
  const params = new URLSearchParams();
  if (view !== "overview") params.set("view", view);
  if (view === "demands") {
    if (filter.query) params.set("q", filter.query);
    if (filter.status !== "ALL") params.set("status", filter.status);
    if (filter.kind !== "ALL") params.set("kind", filter.kind);
  }
  const query = params.toString();
  return `/w/${slug}/projects/${projectId}${query ? `?${query}` : ""}`;
}

export function ProjectDetailView({
  canManage,
  demands,
  filter,
  notice,
  project,
  summary,
  slug,
  timezone,
  view: viewParam,
}: {
  canManage: boolean;
  demands: DemandListItem[];
  filter: { kind: string; query: string; status: string };
  notice?: string;
  project: ProjectDetail;
  summary: ProjectSummary;
  slug: string;
  timezone: string;
  view?: string;
}) {
  const router = useRouter();
  const view = parseProjectView(viewParam);
  const [projectEditOpen, setProjectEditOpen] = useState(false);
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const selectedDemand = demands.find((item) => item.id === selectedDemandId);
  const parents = useMemo(
    () => demands.map((item) => ({ id: item.id, title: item.title })),
    [demands],
  );

  return (
    <PageContainer width="md">
      <div className="project-detail-page">
        <ProjectHeader
          canManage={canManage}
          demandCount={summary.demandCount}
          lastActivityAt={summary.lastActivityAt}
          onArchive={() => router.push(`/w/${slug}/projects?archived=1`)}
          onEdit={() => setProjectEditOpen(true)}
          project={project}
          slug={slug}
          timezone={timezone}
        />
        <ProjectNavigation
          current={view}
          hrefFor={(next) => tabHref(slug, project.id, next, filter)}
        />
        {notice ? (
          <p className="form-message form-message--success" role="status">
            {notice}
          </p>
        ) : null}
        {view === "overview" ? (
          <ProjectOverview
            demandsHref={tabHref(slug, project.id, "demands", filter)}
            onOpenDemand={setSelectedDemandId}
            slug={slug}
            summary={summary}
            timezone={timezone}
            unfilteredDemands={demands}
          />
        ) : null}
        {view === "demands" ? (
          <ProjectDemandsPanel
            demands={demands}
            filter={filter}
            onOpenDemand={setSelectedDemandId}
            slug={slug}
            timezone={timezone}
          />
        ) : null}
        {view === "activity" ? (
          <ProjectActivity demands={demands} timezone={timezone} />
        ) : null}
      </div>
      <ProjectDrawer
        key={`project-edit-${projectEditOpen ? "open" : "closed"}`}
        onClose={() => setProjectEditOpen(false)}
        open={projectEditOpen}
        project={project}
        slug={slug}
      />
      {selectedDemand ? (
        <DemandDrawer
          canManage={canManage}
          demand={selectedDemand}
          initialProjectId={project.id}
          onClose={() => setSelectedDemandId(null)}
          open
          parents={parents}
          projects={[{ id: project.id, name: project.name }]}
          slug={slug}
          timezone={timezone}
        />
      ) : null}
    </PageContainer>
  );
}
