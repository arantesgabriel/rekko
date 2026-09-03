import { DemandsWorkspace } from "@/components/demands/demands-workspace";
import type {
  DemandListItem,
  DemandParentOption,
  DemandProjectOption,
} from "@/modules/projects/service";

export function DemandsView({
  activeTimerWorkItemId,
  canManage,
  demands,
  hasActiveTimer,
  parentOptions,
  projectOptions,
  query,
  slug,
  timezone,
}: {
  activeTimerWorkItemId: string | null;
  canManage: boolean;
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
      activeTimerWorkItemId={activeTimerWorkItemId}
      canManage={canManage}
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
