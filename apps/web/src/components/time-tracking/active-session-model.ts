export type ActiveSessionSnapshot = {
  id: string;
  status: "RUNNING" | "PAUSED";
  projectId: string;
  projectName: string;
  workItemId: string | null;
  workItemTitle: string | null;
  workItemIdentifier: string | null;
  workItemBreadcrumb?: string | null;
  accumulatedSeconds: number;
  openSegmentStartedAt: string | null;
  startedAt: string;
  workspaceSlug: string;
};

export type TimerTarget = {
  projectId: string;
  projectName: string;
  slug: string;
  workspaceName: string;
  workItemId: string;
  workItemTitle: string;
  workItemIdentifier: string | null;
  workItemBreadcrumb?: string | null;
};

export type StartSessionInput = {
  slug: string;
  projectId: string;
  workItemId: string;
  projectName: string;
  workItemTitle: string;
  workItemIdentifier?: string | null | undefined;
  workItemBreadcrumb?: string | null | undefined;
};

export function sessionDemandLabel(session: {
  workItemIdentifier: string | null;
  workItemTitle: string | null;
  projectName: string;
  workItemBreadcrumb?: string | null;
}) {
  const title =
    session.workItemBreadcrumb ?? session.workItemTitle ?? session.projectName;
  return session.workItemIdentifier
    ? session.workItemBreadcrumb
      ? title
      : `${session.workItemIdentifier} · ${title}`
    : title;
}
