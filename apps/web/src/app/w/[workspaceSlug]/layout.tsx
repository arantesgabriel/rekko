import { cookies } from "next/headers";

import { AppShell } from "@/components/app-shell/app-shell";
import { VerificationBanner } from "@/components/auth/verification-banner";
import type { ActiveSessionSnapshot } from "@/components/time-tracking/active-session-model";
import { ActiveSessionProvider } from "@/components/time-tracking/active-session-provider";
import { requireCoreSession } from "@/modules/auth/session";
import {
  listUserWorkspaces,
  requireWorkspace,
} from "@/modules/workspaces/service";
import { workspaceRoleLabel } from "@/modules/workspaces/domain";
import {
  getCurrentTimer,
  listTimerTargets,
} from "@/modules/time-tracking/service";

function toSnapshot(
  timer: NonNullable<Awaited<ReturnType<typeof getCurrentTimer>>>,
): ActiveSessionSnapshot {
  return {
    id: timer.id,
    status: timer.status,
    projectId: timer.projectId,
    projectName: timer.projectName,
    workItemId: timer.workItemId,
    workItemTitle: timer.workItemTitle,
    workItemIdentifier: timer.workItemIdentifier,
    accumulatedSeconds: timer.accumulatedSeconds,
    openSegmentStartedAt: timer.openSegmentStartedAt?.toISOString() ?? null,
    startedAt: timer.startedAt.toISOString(),
    workspaceSlug: timer.workspaceSlug,
  };
}

export default async function WorkspaceLayout({
  children,
  params,
}: LayoutProps<"/w/[workspaceSlug]">) {
  const { workspaceSlug } = await params;
  const session = await requireCoreSession(`/w/${workspaceSlug}`);
  const sidebarCookie = (await cookies()).get("rekko-sidebar")?.value;
  const [current, workspaces, timer, timerTargets] = await Promise.all([
    requireWorkspace(session.user.id, workspaceSlug),
    listUserWorkspaces(session.user.id),
    getCurrentTimer(session.user.id),
    listTimerTargets(session.user.id),
  ]);
  return (
    <ActiveSessionProvider
      initialSession={timer ? toSnapshot(timer) : null}
      targets={timerTargets.items}
      timezone={current.timezone}
    >
      <AppShell
        banner={<VerificationBanner user={session.user} />}
        collapsed={sidebarCookie === "collapsed"}
        userName={session.user.name}
        userRoleLabel={workspaceRoleLabel[current.role]}
        workspaceSlug={workspaceSlug}
        workspaces={workspaces}
      >
        {children}
      </AppShell>
    </ActiveSessionProvider>
  );
}
