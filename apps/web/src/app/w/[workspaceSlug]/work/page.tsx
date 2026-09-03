import { DemandsView } from "@/components/demands/demands-view";
import { PageContainer } from "@/components/ui/page-container";
import { requireCoreSession } from "@/modules/auth/session";
import { listDemands } from "@/modules/projects/service";
import { getCurrentTimer } from "@/modules/time-tracking/service";

export const metadata = { title: "Demandas" };

export default async function DemandsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workspaceSlug } = await params;
  const query = await searchParams;
  const session = await requireCoreSession(`/w/${workspaceSlug}/work`);
  const search = typeof query.q === "string" ? query.q : "";
  const projectId = typeof query.projectId === "string" ? query.projectId : "";
  const status =
    query.status === "ACTIVE" || query.status === "DONE" ? query.status : "ALL";
  const [data, activeTimer] = await Promise.all([
    listDemands({
      userId: session.user.id,
      slug: workspaceSlug,
      ...(search ? { search } : {}),
      ...(projectId ? { projectId } : {}),
      status,
    }),
    getCurrentTimer(session.user.id),
  ]);
  return (
    <PageContainer width="lg">
      <DemandsView
        canManage={data.context.role !== "MEMBER"}
        demands={data.demands}
        activeTimerWorkItemId={activeTimer?.workItemId ?? null}
        hasActiveTimer={Boolean(activeTimer)}
        parentOptions={data.parentOptions}
        projectOptions={data.projectOptions}
        query={{ projectId, search, status }}
        slug={workspaceSlug}
        timezone={data.context.timezone}
      />
    </PageContainer>
  );
}
