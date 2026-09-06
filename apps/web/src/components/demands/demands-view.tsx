import type { DemandListQuery } from "@/components/demands/demand-query";
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
  userTimezone,
}: {
  canManage: boolean;
  counts: { all: number; active: number; done: number };
  demands: DemandListItem[];
  parentOptions: DemandParentOption[];
  projectOptions: DemandProjectOption[];
  query: DemandListQuery;
  slug: string;
  timezone: string;
  userTimezone: string;
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
      userTimezone={userTimezone}
    />
  );
}
