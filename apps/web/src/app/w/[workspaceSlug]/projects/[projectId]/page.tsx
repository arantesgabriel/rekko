import { notFound } from "next/navigation";

import { ProjectDetailView } from "@/components/projects/project-detail-view";
import { requireCoreSession } from "@/modules/auth/session";
import { ProjectError } from "@/modules/projects/errors";
import { getProjectPage } from "@/modules/projects/service";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string; projectId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workspaceSlug, projectId } = await params;
  const query = await searchParams;
  const session = await requireCoreSession(
    `/w/${workspaceSlug}/projects/${projectId}`,
  );
  let data;
  try {
    const search = typeof query.q === "string" ? query.q : undefined;
    data = await getProjectPage({
      userId: session.user.id,
      slug: workspaceSlug,
      projectId,
      ...(search ? { search } : {}),
      status:
        query.status === "TODO" ||
        query.status === "IN_PROGRESS" ||
        query.status === "DONE"
          ? query.status
          : "ALL",
      kind:
        query.kind === "ROOT" || query.kind === "SUB_ITEM" ? query.kind : "ALL",
    });
  } catch (error) {
    if (error instanceof ProjectError && error.code === "PROJECT_NOT_FOUND")
      notFound();
    throw error;
  }
  return (
    <ProjectDetailView
      canManage={
        data.context.role !== "MEMBER" &&
        !data.project.archivedAt &&
        data.project.source !== "LINEAR"
      }
      demands={data.demandItems}
      filter={{
        kind: typeof query.kind === "string" ? query.kind : "ALL",
        query: typeof query.q === "string" ? query.q : "",
        status: typeof query.status === "string" ? query.status : "ALL",
      }}
      project={{
        id: data.project.id,
        name: data.project.name,
        description: data.project.description,
        source: data.project.source,
        status: data.project.status,
        estimatedMinutes: data.project.estimatedMinutes,
        archivedAt: data.project.archivedAt,
      }}
      summary={data.projectSummary}
      slug={workspaceSlug}
      timezone={data.context.timezone}
      {...(query.created === "1"
        ? { notice: "Projeto criado." }
        : query.linear === "imported"
          ? { notice: "Demandas importadas." }
          : {})}
    />
  );
}
