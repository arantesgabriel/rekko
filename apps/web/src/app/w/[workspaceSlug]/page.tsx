import Link from "next/link";

import { requireCoreSession } from "@/modules/auth/session";
import {
  listWorkspacePeople,
  requireWorkspace,
} from "@/modules/workspaces/service";
import { listProjects } from "@/modules/projects/service";

export default async function WorkspaceHomePage({
  params,
}: PageProps<"/w/[workspaceSlug]">) {
  const { workspaceSlug } = await params;
  const session = await requireCoreSession(`/w/${workspaceSlug}`);
  const [current, people, work] = await Promise.all([
    requireWorkspace(session.user.id, workspaceSlug),
    listWorkspacePeople(session.user.id, workspaceSlug),
    listProjects(session.user.id, workspaceSlug),
  ]);
  const invited = people.invitations.some(
    (item) => item.status === "PENDING" || item.status === "ACCEPTED",
  );
  return (
    <div className="product-page workspace-ready">
      <header className="page-header">
        <div>
          <p className="page-context">{current.name}</p>
          <h1>Seu Workspace está pronto.</h1>
          <p>Organize pessoas, projetos e demandas a partir deste espaço.</p>
        </div>
        <Link
          className="button button--secondary"
          href={`/w/${workspaceSlug}/members`}
        >
          Ver Members
        </Link>
      </header>
      <section
        className="getting-started"
        aria-labelledby="getting-started-title"
      >
        <h2 id="getting-started-title">Primeiros passos</h2>
        <ol>
          <li className="is-complete">
            <span>✓</span>
            <div>
              <strong>Criar Workspace</strong>
              <small>
                {current.name} · {current.timezone}
              </small>
            </div>
          </li>
          <li className={invited ? "is-complete" : ""}>
            <span>{invited ? "✓" : "○"}</span>
            <div>
              <strong>Convidar seu time</strong>
              <small>
                {invited
                  ? "Convite criado"
                  : "Opcional — você pode fazer isso quando quiser"}
              </small>
            </div>
            {!invited && current.role !== "MEMBER" && (
              <Link href={`/w/${workspaceSlug}/members`}>Convidar</Link>
            )}
          </li>
          <li className={work.projects.length > 0 ? "is-complete" : ""}>
            <span>{work.projects.length > 0 ? "✓" : "○"}</span>
            <div>
              <strong>Criar seu primeiro projeto</strong>
              <small>
                {work.projects.length > 0
                  ? `${work.projects.length} projeto(s) criado(s)`
                  : "Organize as primeiras demandas do Workspace"}
              </small>
            </div>
            {work.projects.length === 0 && current.role !== "MEMBER" && (
              <Link href={`/w/${workspaceSlug}/work/new`}>Criar projeto</Link>
            )}
          </li>
        </ol>
      </section>
      <section className="phase-note">
        <div className="segment-mark segment-mark--brand" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <h2>Seu trabalho, com contexto.</h2>
        <p>
          Use Work para criar projetos manuais e organizar demandas. O registro
          de tempo permanece fora desta fase.
        </p>
      </section>
    </div>
  );
}
