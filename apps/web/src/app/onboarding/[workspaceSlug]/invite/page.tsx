import { redirect } from "next/navigation";

import { requireCoreSession } from "@/modules/auth/session";
import { requireWorkspace } from "@/modules/workspaces/service";

export default async function LegacyInviteOnboardingPage({
  params,
}: PageProps<"/onboarding/[workspaceSlug]/invite">) {
  const { workspaceSlug } = await params;
  const session = await requireCoreSession(`/w/${workspaceSlug}/members`);
  await requireWorkspace(session.user.id, workspaceSlug);
  redirect(`/w/${workspaceSlug}/members`);
}
