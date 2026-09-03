import { ProjectsSkeleton } from "@/components/projects/projects-skeleton";
import { PageContainer } from "@/components/ui/page-container";

export default function ProjectDetailLoading() {
  return (
    <PageContainer width="lg">
      <ProjectsSkeleton detail />
    </PageContainer>
  );
}
