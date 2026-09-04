import { ProjectsView } from "@/components/projects/projects-view";
import { requireCoreSession } from "@/modules/auth/session";
import { listProjects } from "@/modules/projects/service";

export const metadata = { title: "Projetos" };

export default async function ProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workspaceSlug } = await params;
  const query = await searchParams;
  const session = await requireCoreSession(`/w/${workspaceSlug}/projects`);
  const { context, projects } = await listProjects(
    session.user.id,
    workspaceSlug,
  );
  return (
    <ProjectsView
      canManage={context.role !== "MEMBER"}
      projects={projects}
      slug={workspaceSlug}
      timezone={context.timezone}
      {...(query.archived === "1" ? { notice: "Projeto arquivado." } : {})}
    />
  );
}
