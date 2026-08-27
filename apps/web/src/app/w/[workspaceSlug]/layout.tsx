import { cookies } from "next/headers";

import { AppShell } from "@/components/app-shell/app-shell";
import { VerificationBanner } from "@/components/auth/verification-banner";
import { TimerDock } from "@/components/time-tracking/timer-controls";
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
    <AppShell
      banner={<VerificationBanner user={session.user} />}
      collapsed={sidebarCookie === "collapsed"}
      timer={timer ? <TimerDock timer={timer} targets={timerTargets} /> : null}
      userName={session.user.name}
      userRoleLabel={workspaceRoleLabel[current.role]}
      workspaceSlug={workspaceSlug}
      workspaces={workspaces}
    >
      {children}
    </AppShell>
  );
}
