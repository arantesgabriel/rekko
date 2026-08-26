import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { ProjectForm } from "@/components/projects/project-form";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { requireCoreSession } from "@/modules/auth/session";
import { requireWorkspace } from "@/modules/workspaces/service";

export default async function ProjectOnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workspaceSlug } = await params;
  const query = await searchParams;
  const session = await requireCoreSession(
    `/onboarding/${workspaceSlug}/project`,
  );
  const context = await requireWorkspace(
    session.user.id,
    workspaceSlug,
    "project:manage",
  );
  const manual = query.source === "manual";
  return (
    <main className="onboarding-shell">
      <header className="onboarding-header">
        <BrandMark />
        <ThemeSwitcher />
      </header>
      <section className="onboarding-panel onboarding-panel--wide">
        <div className="onboarding-progress" aria-label="Etapa 3 de 3">
          <span className="is-done" />
          <span className="is-done" />
          <span className="is-active" />
        </div>
        <p className="onboarding-step">Etapa 3 de 3 · {context.name}</p>
        <h1>
          {manual
            ? "Crie seu primeiro projeto"
            : "Como você quer organizar seu primeiro projeto?"}
        </h1>
        <p>
          {manual
            ? "Só precisamos do essencial para começar."
            : "Você também pode pular e criar um projeto mais tarde em Work."}
        </p>
        {manual ? (
          <ProjectForm slug={workspaceSlug} />
        ) : (
          <div className="source-options">
            <Link
              className="source-option"
              href={`/onboarding/${workspaceSlug}/project?source=manual`}
            >
              <strong>Criar manualmente</strong>
              <span>Cadastre projetos e demandas no Rekko.</span>
              <b>Continuar →</b>
            </Link>
            <div className="source-option is-disabled" aria-disabled="true">
              <strong>Linear</strong>
              <span>A conexão seletiva estará disponível em breve.</span>
              <b>Em breve</b>
            </div>
          </div>
        )}
        <Link className="skip-link" href={`/w/${workspaceSlug}/work`}>
          Pular por agora
        </Link>
      </section>
    </main>
  );
}
