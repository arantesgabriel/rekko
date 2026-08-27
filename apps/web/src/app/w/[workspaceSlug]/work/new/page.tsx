import Link from "next/link";

import { ProjectForm } from "@/components/projects/project-form";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { requireCoreSession } from "@/modules/auth/session";
import { requireWorkspace } from "@/modules/workspaces/service";

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
  const context = await requireWorkspace(
    session.user.id,
    workspaceSlug,
    "project:manage",
  );
  const manual = query.source === "manual";
  return (
    <PageContainer width="narrow">
      <Link className="back-link" href={`/w/${workspaceSlug}/work`}>
        ← Voltar para projetos
      </Link>
      <PageHeader
        description={
          manual
            ? "Comece com o essencial. Você poderá ajustar tudo depois."
            : "Escolha de onde o trabalho virá."
        }
        eyebrow={context.name}
        title={
          manual ? "Criar projeto manual" : "Como você quer criar este projeto?"
        }
      />
      {manual ? (
        <ProjectForm slug={workspaceSlug} />
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
          <div className="source-option is-disabled" aria-disabled="true">
            <strong className="card-title">Conectar ao Linear</strong>
            <span>A importação seletiva chega em uma próxima fase.</span>
            <b>Em breve</b>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
