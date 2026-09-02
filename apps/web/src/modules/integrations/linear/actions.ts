"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCoreSession } from "@/modules/auth/session";
import {
  connectLinear,
  disconnectLinear,
  importLinearIssues,
  LinearIntegrationError,
  syncLinearProject,
} from "./service";
import { project } from "@rekko/db";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { requireWorkspace } from "@/modules/workspaces/service";
import { z } from "zod";

const importSchema = z.object({
  existingProjectId: z.string().uuid().optional(),
  issueIds: z.array(z.string().min(1)).min(1).max(200),
  projectName: z.string().trim().min(1).max(120).optional(),
});

export async function importLinearIssuesAction(
  slug: string,
  formData: FormData,
) {
  const session = await requireCoreSession(`/w/${slug}/work`);
  const parsed = importSchema.safeParse({
    existingProjectId:
      String(formData.get("existingProjectId") || "") || undefined,
    issueIds: formData.getAll("issueIds").map(String),
    projectName: String(formData.get("projectName") || "") || undefined,
  });
  if (!parsed.success)
    redirect(`/w/${slug}/work/new?source=linear&error=selection`);
  let result;
  try {
    result = await importLinearIssues({
      issueIds: parsed.data.issueIds,
      ...(parsed.data.existingProjectId
        ? { existingProjectId: parsed.data.existingProjectId }
        : {}),
      ...(parsed.data.projectName
        ? { projectName: parsed.data.projectName }
        : {}),
      slug,
      userId: session.user.id,
    });
  } catch (error) {
    if (error instanceof LinearIntegrationError)
      redirect(
        `/w/${slug}/work/new?source=linear&error=${error.code.toLowerCase()}`,
      );
    throw error;
  }
  revalidatePath(`/w/${slug}`);
  revalidatePath(`/w/${slug}/insights`);
  redirect(`/w/${slug}/projects/${result.projectId}?linear=imported`);
}

export async function disconnectLinearAction(slug: string) {
  const session = await requireCoreSession(`/w/${slug}/integrations`);
  await disconnectLinear({ slug, userId: session.user.id });
  revalidatePath(`/w/${slug}`);
  revalidatePath(`/w/${slug}/insights`);
  redirect(`/w/${slug}/integrations?linear=disconnected`);
}

export async function connectLinearE2EAction(slug: string) {
  if (process.env.REKKO_E2E !== "true") throw new Error("Not available");
  const session = await requireCoreSession(`/w/${slug}/integrations`);
  await connectLinear({
    externalWorkspaceId: `linear-${slug}`,
    externalWorkspaceName: "Linear Test Workspace",
    slug,
    tokens: {
      accessToken: "e2e-access-token",
      expiresAt: new Date(Date.now() + 86_400_000),
      refreshToken: "e2e-refresh-token",
      scopes: ["read"],
    },
    userId: session.user.id,
  });
  revalidatePath(`/w/${slug}`);
  revalidatePath(`/w/${slug}/insights`);
  redirect(`/w/${slug}/integrations?linear=connected`);
}

export async function syncLinearAction(slug: string) {
  const session = await requireCoreSession(`/w/${slug}/integrations`);
  const workspace = await requireWorkspace(
    session.user.id,
    slug,
    "linear:manage",
  );
  const projects = await db
    .select({ id: project.id })
    .from(project)
    .where(
      and(
        eq(project.workspaceId, workspace.id),
        eq(project.source, "LINEAR"),
        isNull(project.archivedAt),
      ),
    );
  for (const item of projects)
    await syncLinearProject({
      projectId: item.id,
      slug,
      userId: session.user.id,
    });
  revalidatePath(`/w/${slug}`);
  revalidatePath(`/w/${slug}/insights`);
  redirect(`/w/${slug}/integrations?linear=synced`);
}
