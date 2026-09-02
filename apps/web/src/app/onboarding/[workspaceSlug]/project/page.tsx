import { redirect } from "next/navigation";

import { requireCoreSession } from "@/modules/auth/session";
import { requireWorkspace } from "@/modules/workspaces/service";

export default async function LegacyProjectOnboardingPage({
  params,
}: PageProps<"/onboarding/[workspaceSlug]/project">) {
  const { workspaceSlug } = await params;
  const session = await requireCoreSession(`/w/${workspaceSlug}/work`);
  await requireWorkspace(session.user.id, workspaceSlug);
  redirect(`/w/${workspaceSlug}/work`);
}
