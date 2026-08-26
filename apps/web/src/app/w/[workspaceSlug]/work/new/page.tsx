import Link from "next/link";

import { ProjectForm } from "@/components/projects/project-form";
import { requireCoreSession } from "@/modules/auth/session";
import { requireWorkspace } from "@/modules/workspaces/service";

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
    <div className="product-page product-page--narrow">
      <Link className="back-link" href={`/w/${workspaceSlug}/work`}>
        ← Voltar para Work
      </Link>
      <header className="page-header">
        <div>
          <p className="page-context">{context.name}</p>
          <h1>
            {manual
              ? "Criar projeto manual"
              : "Como você quer criar este projeto?"}
          </h1>
          <p>
            {manual
              ? "Comece com o essencial. Você poderá ajustar tudo depois."
              : "Escolha de onde o trabalho virá."}
          </p>
        </div>
      </header>
      {manual ? (
        <ProjectForm slug={workspaceSlug} />
      ) : (
        <div className="source-options">
          <Link
            className="source-option"
            href={`/w/${workspaceSlug}/work/new?source=manual`}
          >
            <strong>Criar manualmente</strong>
            <span>Organize projetos e demandas direto no Rekko.</span>
            <b>Continuar →</b>
          </Link>
          <div className="source-option is-disabled" aria-disabled="true">
            <strong>Conectar ao Linear</strong>
            <span>A importação seletiva chega em uma próxima fase.</span>
            <b>Em breve</b>
          </div>
        </div>
      )}
    </div>
  );
}
