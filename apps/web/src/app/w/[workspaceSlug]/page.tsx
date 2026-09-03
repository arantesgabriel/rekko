import { HomeView } from "@/components/timeline/home-view";
import { PageContainer } from "@/components/ui/page-container";
import { requireCoreSession } from "@/modules/auth/session";
import { getLinearConnection } from "@/modules/integrations/linear/service";
import {
  getDailyTimeline,
  getGettingStartedProgress,
  getWeekDaySummaries,
  listManualTimeTargets,
  listRecentWorkItems,
} from "@/modules/timeline/service";
import { dateInTimezone } from "@/modules/timeline/domain";
import { getCurrentTimer } from "@/modules/time-tracking/service";

export default async function HomePage({
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
  const [
    timeline,
    targets,
    gettingStarted,
    linear,
    recentItems,
    activeTimer,
    weekDays,
  ] = await Promise.all([
    getDailyTimeline({
      userId: session.user.id,
      slug: workspaceSlug,
      ...(requestedDate ? { date: requestedDate } : {}),
    }),
    listManualTimeTargets(session.user.id, workspaceSlug),
    getGettingStartedProgress(session.user.id, workspaceSlug),
    getLinearConnection({ slug: workspaceSlug, userId: session.user.id }),
    listRecentWorkItems(session.user.id, workspaceSlug, 8),
    getCurrentTimer(session.user.id),
    getWeekDaySummaries({
      userId: session.user.id,
      slug: workspaceSlug,
      ...(requestedDate ? { date: requestedDate } : {}),
    }),
  ]);
  return (
    <PageContainer width="lg">
      <HomeView
        slug={workspaceSlug}
        date={timeline.date}
        timezone={timeline.timezone}
        blocks={timeline.blocks}
        trackedSeconds={timeline.trackedSeconds}
        isToday={timeline.isToday}
        todayDate={dateInTimezone(new Date(), timeline.timezone)}
        targets={targets}
        recentItems={recentItems}
        weekDays={weekDays}
        hasActiveTimer={Boolean(activeTimer)}
        gettingStarted={{
          ...gettingStarted,
          hasLinear: linear.connection?.status === "CONNECTED",
        }}
      />
    </PageContainer>
  );
}
