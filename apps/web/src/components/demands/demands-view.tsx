import { DemandsWorkspace } from "@/components/demands/demands-workspace";
import type {
  DemandListItem,
  DemandParentOption,
  DemandProjectOption,
} from "@/modules/projects/service";

export function DemandsView({
  canManage,
  counts,
  demands,
  parentOptions,
  projectOptions,
  query,
  slug,
  timezone,
}: {
  canManage: boolean;
  counts: { all: number; active: number; done: number };
  demands: DemandListItem[];
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
      canManage={canManage}
      counts={counts}
      demands={demands}
      parentOptions={parentOptions}
      projectOptions={projectOptions}
      query={query}
      slug={slug}
      timezone={timezone}
    />
  );
}
