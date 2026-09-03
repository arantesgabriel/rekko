import { ProjectsSkeleton } from "@/components/projects/projects-skeleton";
import { PageContainer } from "@/components/ui/page-container";

export default function ProjectsLoading() {
  return (
    <PageContainer width="lg">
      <ProjectsSkeleton />
    </PageContainer>
  );
}
