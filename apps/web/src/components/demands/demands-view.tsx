import type { DemandListQuery } from "@/components/demands/demand-query";
import { DemandsWorkspace } from "@/components/demands/demands-workspace";
import type {
  DemandListItem,
  DemandParentOption,
  DemandProjectOption,
  DemandRelationItem,
} from "@/modules/projects/service";

export function DemandsView({
  canManage,
  counts,
  demands,
  parentOptions,
  projectOptions,
  relations,
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
  relations: DemandRelationItem[];
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
      relations={relations}
      query={query}
      slug={slug}
      timezone={timezone}
      userTimezone={userTimezone}
    />
  );
}
