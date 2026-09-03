import { DemandsWorkspace } from "@/components/demands/demands-workspace";
import type {
  DemandListItem,
  DemandProjectOption,
} from "@/modules/projects/service";

export function DemandsView({
  canManage,
  demands,
  projectOptions,
  query,
  slug,
  timezone,
}: {
  canManage: boolean;
  demands: DemandListItem[];
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
      demands={demands}
      projectOptions={projectOptions}
      query={query}
      slug={slug}
      timezone={timezone}
    />
  );
}
