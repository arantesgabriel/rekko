import { TodayView } from "@/components/timeline/today-view";
import { PageContainer } from "@/components/ui/page-container";
import { requireCoreSession } from "@/modules/auth/session";
import {
  getDailyTimeline,
  listManualTimeTargets,
} from "@/modules/timeline/service";

export default async function TodayPage({
  params,
  searchParams,
}: PageProps<"/w/[workspaceSlug]"> & {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workspaceSlug } = await params;
  const query = await searchParams;
  const session = await requireCoreSession(`/w/${workspaceSlug}`);
  const requestedDate =
    typeof query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.date)
      ? query.date
      : undefined;
  const [timeline, targets] = await Promise.all([
    getDailyTimeline({
      userId: session.user.id,
      slug: workspaceSlug,
      ...(requestedDate ? { date: requestedDate } : {}),
    }),
    listManualTimeTargets(session.user.id, workspaceSlug),
  ]);
  return (
    <PageContainer width="lg">
      <TodayView
        slug={workspaceSlug}
        date={timeline.date}
        timezone={timeline.timezone}
        blocks={timeline.blocks}
        gaps={timeline.gaps}
        trackedSeconds={timeline.trackedSeconds}
        isToday={timeline.isToday}
        targets={targets}
      />
    </PageContainer>
  );
}
