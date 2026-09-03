import { DemandList } from "@/components/demands/demand-list";
import type { DemandListItem } from "@/modules/projects/service";

export function ProjectDemandTable({
  demands,
  onOpen,
  slug,
  timezone,
}: {
  demands: DemandListItem[];
  onOpen: (demandId: string) => void;
  slug: string;
  timezone: string;
}) {
  return (
    <DemandList
      context="project"
      demands={demands}
      onOpen={onOpen}
      slug={slug}
      timezone={timezone}
    />
  );
}
