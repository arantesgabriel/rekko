import { InviteForm } from "@/components/workspaces/invite-form";
import { MemberManager } from "@/components/workspaces/member-manager";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { requireCoreSession } from "@/modules/auth/session";
import { listWorkspacePeople } from "@/modules/workspaces/service";

export const metadata = { title: "Membros" };

export default async function MembersPage({
  params,
}: PageProps<"/w/[workspaceSlug]/members">) {
  const { workspaceSlug } = await params;
  const session = await requireCoreSession(`/w/${workspaceSlug}/members`);
  const data = await listWorkspacePeople(session.user.id, workspaceSlug);
  const pendingCount = data.invitations.filter(
    (item) => item.status !== "ACCEPTED",
  ).length;
  return (
    <PageContainer width="wide">
      <PageHeader
        description="Gerencie quem participa, o cargo e as permissões deste Workspace."
        title="Membros"
      />
      {data.context.role !== "MEMBER" ? (
        <>
          <section
            className="invite-section invite-surface invite-section--desktop"
            aria-labelledby="invite-member-title"
          >
            <SectionHeader
              description="O convite expira em 7 dias. Cargo e permissão podem ser ajustados depois."
              id="invite-member-title"
              title="Convidar pessoa"
            />
            <InviteForm compact idSuffix="desktop" slug={workspaceSlug} />
          </section>
          <section className="invite-section invite-section--mobile">
            <details className="invite-disclosure">
              <summary className="invite-disclosure__summary">
                <span>
                  <strong>Convidar pessoa</strong>
                  <small>Adicione alguém ao Workspace</small>
                </span>
                <span className="button button--secondary button--sm">
                  + Convidar
                </span>
              </summary>
              <div className="invite-disclosure__panel">
                <p>
                  O convite expira em 7 dias. Você pode ajustar os dados depois.
                </p>
                <InviteForm compact idSuffix="mobile" slug={workspaceSlug} />
              </div>
            </details>
          </section>
        </>
      ) : null}
      <section aria-labelledby="people-title">
        <SectionHeader
          description={`${data.members.length} ${data.members.length === 1 ? "ativo" : "ativos"}${pendingCount ? ` · ${pendingCount} convite${pendingCount === 1 ? "" : "s"}` : ""}`}
          id="people-title"
          title="Pessoas"
        />
        <MemberManager
          actorRole={data.context.role}
          invitations={data.invitations}
          members={data.members}
          slug={workspaceSlug}
        />
      </section>
    </PageContainer>
  );
}
