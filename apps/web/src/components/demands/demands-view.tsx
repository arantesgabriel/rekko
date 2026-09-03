import { DemandsWorkspace } from "@/components/demands/demands-workspace";
import type {
  DemandListItem,
  DemandParentOption,
  DemandProjectOption,
} from "@/modules/projects/service";

export function DemandsView({
  activeTimerStatus,
  activeTimerWorkItemId,
  canManage,
  counts,
  demands,
  hasActiveTimer,
  parentOptions,
  projectOptions,
  query,
  slug,
  timezone,
}: {
  activeTimerStatus: "RUNNING" | "PAUSED" | null;
  activeTimerWorkItemId: string | null;
  canManage: boolean;
  counts: { all: number; active: number; done: number };
  demands: DemandListItem[];
  hasActiveTimer: boolean;
  parentOptions: DemandParentOption[];
  projectOptions: DemandProjectOption[];
  query: {
    projectId: string;
    search: string;
    status: "ALL" | "ACTIVE" | "DONE";
  };
  slug: string;
  timezone: string;
}) {
  return (
    <DemandsWorkspace
      activeTimerStatus={activeTimerStatus}
      activeTimerWorkItemId={activeTimerWorkItemId}
      canManage={canManage}
      counts={counts}
      demands={demands}
      hasActiveTimer={hasActiveTimer}
      parentOptions={parentOptions}
      projectOptions={projectOptions}
      query={query}
      slug={slug}
      timezone={timezone}
    />
  );
}
