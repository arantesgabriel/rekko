import { InviteForm } from "@/components/workspaces/invite-form";
import { MemberManager } from "@/components/workspaces/member-manager";
import { requireCoreSession } from "@/modules/auth/session";
import { listWorkspacePeople } from "@/modules/workspaces/service";

export const metadata = { title: "Members" };

export default async function MembersPage({
  params,
}: PageProps<"/w/[workspaceSlug]/members">) {
  const { workspaceSlug } = await params;
  const session = await requireCoreSession(`/w/${workspaceSlug}/members`);
  const data = await listWorkspacePeople(session.user.id, workspaceSlug);
  return (
    <div className="product-page members-page">
      <header className="page-header">
        <div>
          <p className="page-context">{data.context.name}</p>
          <h1>Members</h1>
          <p>
            Gerencie quem participa, o cargo profissional e as permissões dentro
            deste Workspace.
          </p>
        </div>
      </header>
      {data.context.role !== "MEMBER" && (
        <section
          className="invite-section"
          aria-labelledby="invite-member-title"
        >
          <div>
            <h2 id="invite-member-title">Convidar pessoa</h2>
            <p>
              O convite expira em 7 dias. Cargo e role podem ser ajustados
              depois.
            </p>
          </div>
          <InviteForm compact slug={workspaceSlug} />
        </section>
      )}
      <section aria-labelledby="people-title">
        <div className="section-heading">
          <h2 id="people-title">Pessoas</h2>
          <span>{data.members.length} active</span>
        </div>
        <MemberManager
          actorRole={data.context.role}
          invitations={data.invitations}
          members={data.members}
          slug={workspaceSlug}
        />
      </section>
    </div>
  );
}
