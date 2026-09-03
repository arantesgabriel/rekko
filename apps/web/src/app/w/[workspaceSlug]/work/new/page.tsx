import Link from "next/link";

import { ProjectForm } from "@/components/projects/project-form";
import { NewDemandForm } from "@/components/projects/new-demand-form";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { requireCoreSession } from "@/modules/auth/session";
import { requireWorkspace } from "@/modules/workspaces/service";
import { listProjects } from "@/modules/projects/service";
import { getLinearConnection } from "@/modules/integrations/linear/service";
import { LinearBrowser } from "@/components/linear/linear-browser";
import { importLinearIssuesAction } from "@/modules/integrations/linear/actions";

export const metadata = { title: "Novo projeto" };

export default async function NewProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workspaceSlug } = await params;
  const query = await searchParams;
  const session = await requireCoreSession(`/w/${workspaceSlug}/work/new`);
  const existingProjectId =
    typeof query.existingProjectId === "string"
      ? query.existingProjectId
      : undefined;
  const mode = query.mode === "demand";
  await requireWorkspace(
    session.user.id,
    workspaceSlug,
    mode || !existingProjectId ? "project:manage" : undefined,
  );
  if (mode) {
    const { projects } = await listProjects(session.user.id, workspaceSlug);
    const activeProjects = projects
      .filter((project) => project.status === "ACTIVE")
      .map(({ id, name }) => ({ id, name }));
    return (
      <PageContainer width="narrow">
        <Link className="back-link" href={`/w/${workspaceSlug}/work`}>
          ← Voltar para demandas
        </Link>
        <PageHeader
          description="Dê um contexto ao trabalho e registre seu tempo com mais clareza."
          title="Nova demanda"
        />
        <NewDemandForm projects={activeProjects} slug={workspaceSlug} />
      </PageContainer>
    );
  }
  const manual = query.source === "manual";
  const linear = query.source === "linear";
  const { connection } = await getLinearConnection({
    slug: workspaceSlug,
    userId: session.user.id,
  });
  return (
    <PageContainer width="narrow">
      <Link className="back-link" href={`/w/${workspaceSlug}/projects`}>
        ← Voltar para projetos
      </Link>
      <PageHeader
        description={
          manual
            ? "Comece com o essencial. Você poderá ajustar tudo depois."
            : linear
              ? "Pesquise e selecione somente as demandas que importam para este projeto."
              : "Escolha de onde o trabalho virá."
        }
        title={
          manual
            ? "Criar projeto manual"
            : linear
              ? "Criar projeto com Linear"
              : "Como você quer criar este projeto?"
        }
      />
      {manual ? (
        <ProjectForm slug={workspaceSlug} />
      ) : linear && connection?.status === "CONNECTED" ? (
        <LinearBrowser
          action={importLinearIssuesAction.bind(null, workspaceSlug)}
          {...(existingProjectId ? { existingProjectId } : {})}
          query={query}
          slug={workspaceSlug}
          userId={session.user.id}
        />
      ) : linear ? (
        <div className="empty-inline">
          <p>
            Conecte o Linear antes de criar um projeto com demandas externas.
          </p>
          <Link
            className="button button--primary"
            href={`/w/${workspaceSlug}/integrations`}
          >
            Ir para Integrações
          </Link>
        </div>
      ) : (
        <div className="source-options">
          <Link
            className="source-option"
            href={`/w/${workspaceSlug}/work/new?source=manual`}
          >
            <strong className="card-title">Criar manualmente</strong>
            <span>Organize projetos e demandas direto no Rekko.</span>
            <b>Continuar →</b>
          </Link>
          <Link
            className="source-option"
            href={`/w/${workspaceSlug}/work/new?source=linear`}
          >
            <strong className="card-title">Criar com Linear</strong>
            <span>Escolha somente as demandas que quer acompanhar.</span>
            <b>Continuar →</b>
          </Link>
        </div>
      )}
    </PageContainer>
  );
}
