"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { requireCoreSession } from "@/modules/auth/session";
import { WorkspaceError } from "@/modules/workspaces/errors";

import { ProjectError, projectErrorMessage } from "./errors";
import { projectInputSchema, workItemInputSchema } from "./schemas";
import {
  archiveProject,
  createProject,
  archiveWorkItem,
  createWorkItem,
  duplicateWorkItem,
  moveWorkItem,
  setWorkItemStatus,
  updateProject,
  updateWorkItem,
} from "./service";

export type ProjectActionState = {
  message: string;
  status: "error" | "idle" | "success";
};

export async function createProjectAction(
  slug: string,
  _state: ProjectActionState,
  formData: FormData,
) {
  const session = await requireCoreSession(`/w/${slug}/work/new`);
  const parsed = parseProjectForm(formData);
  if (!parsed.success)
    return errorState("Revise o nome, o status e a estimativa.");
  let created: { id: string };
  try {
    created = await createProject({
      actorUserId: session.user.id,
      slug,
      ...parsed.data,
    });
  } catch (error) {
    return mappedError(error);
  }
  redirect(`/w/${slug}/projects/${created.id}?created=1`);
}

export async function createProjectDrawerAction(
  slug: string,
  _state: ProjectActionState,
  formData: FormData,
) {
  const session = await requireCoreSession(`/w/${slug}/projects`);
  const parsed = parseProjectForm(formData);
  if (!parsed.success)
    return errorState("Revise o nome, o status e a estimativa.");
  try {
    await createProject({
      actorUserId: session.user.id,
      slug,
      ...parsed.data,
    });
    revalidatePath(`/w/${slug}/projects`);
    revalidatePath(`/w/${slug}/work`);
    return successState("Projeto criado.");
  } catch (error) {
    return mappedError(error);
  }
}

export async function updateProjectAction(
  slug: string,
  projectId: string,
  _state: ProjectActionState,
  formData: FormData,
) {
  const session = await requireCoreSession(`/w/${slug}/projects/${projectId}`);
  const parsed = parseProjectForm(formData);
  if (!parsed.success)
    return errorState("Revise o nome, o status e a estimativa.");
  try {
    await updateProject({
      actorUserId: session.user.id,
      slug,
      projectId,
      ...parsed.data,
    });
    revalidatePath(`/w/${slug}/work`);
    revalidatePath(`/w/${slug}/projects/${projectId}`);
    revalidatePath(`/w/${slug}/insights`);
    return successState("Projeto atualizado.");
  } catch (error) {
    return mappedError(error);
  }
}

export async function archiveProjectAction(slug: string, projectId: string) {
  const session = await requireCoreSession(`/w/${slug}/projects/${projectId}`);
  try {
    await archiveProject({ actorUserId: session.user.id, slug, projectId });
  } catch (error) {
    logger.warn(
      { error, module: "projects", operation: "archive" },
      "Project archive rejected",
    );
    redirect(`/w/${slug}/projects/${projectId}?error=archive`);
  }
  revalidatePath(`/w/${slug}/work`);
  revalidatePath(`/w/${slug}/projects`);
  revalidatePath(`/w/${slug}/insights`);
  redirect(`/w/${slug}/projects?archived=1`);
}

export async function archiveProjectDrawerAction(
  slug: string,
  projectId: string,
) {
  const session = await requireCoreSession(`/w/${slug}/projects`);
  try {
    await archiveProject({ actorUserId: session.user.id, slug, projectId });
    revalidatePath(`/w/${slug}/work`);
    revalidatePath(`/w/${slug}/projects`);
    revalidatePath(`/w/${slug}/insights`);
    return successState("Projeto arquivado.");
  } catch (error) {
    return mappedError(error);
  }
}

export async function createWorkItemAction(
  slug: string,
  projectId: string,
  _state: ProjectActionState,
  formData: FormData,
) {
  const session = await requireCoreSession(`/w/${slug}/projects/${projectId}`);
  const parsed = parseWorkItemForm(formData);
  if (!parsed.success)
    return errorState("Revise os dados da demanda e a estimativa.");
  try {
    await createWorkItem({
      actorUserId: session.user.id,
      slug,
      projectId,
      ...parsed.data,
    });
    revalidatePath(`/w/${slug}/projects/${projectId}`);
    revalidatePath(`/w/${slug}/work`);
    revalidatePath(`/w/${slug}/insights`);
    return successState("Demanda criada.");
  } catch (error) {
    return mappedError(error);
  }
}

export async function createGlobalWorkItemAction(
  slug: string,
  _state: ProjectActionState,
  formData: FormData,
) {
  const session = await requireCoreSession(`/w/${slug}/work/new?mode=demand`);
  const projectId = z.uuid().safeParse(formData.get("projectId"));
  const parsed = parseWorkItemForm(formData);
  if (!projectId.success || !parsed.success)
    return errorState("Revise o projeto, os dados da demanda e a estimativa.");
  try {
    await createWorkItem({
      actorUserId: session.user.id,
      slug,
      projectId: projectId.data,
      ...parsed.data,
    });
  } catch (error) {
    return mappedError(error);
  }
  revalidatePath(`/w/${slug}/work`);
  revalidatePath(`/w/${slug}/projects/${projectId.data}`);
  revalidatePath(`/w/${slug}/insights`);
  redirect(`/w/${slug}/work?created=1`);
}

export async function updateWorkItemAction(
  slug: string,
  projectId: string,
  itemId: string,
  _state: ProjectActionState,
  formData: FormData,
) {
  const session = await requireCoreSession(`/w/${slug}/projects/${projectId}`);
  const parsed = parseWorkItemForm(formData);
  if (!parsed.success)
    return errorState("Revise os dados da demanda e a estimativa.");
  try {
    await updateWorkItem({
      actorUserId: session.user.id,
      slug,
      projectId,
      itemId,
      ...parsed.data,
    });
    revalidatePath(`/w/${slug}/projects/${projectId}`);
    revalidatePath(`/w/${slug}/work`);
    revalidatePath(`/w/${slug}/insights`);
    return successState("Demanda atualizada.");
  } catch (error) {
    return mappedError(error);
  }
}

export async function createDemandDrawerAction(
  slug: string,
  _state: ProjectActionState,
  formData: FormData,
) {
  const session = await requireCoreSession(`/w/${slug}/work`);
  const projectId = z.uuid().safeParse(formData.get("projectId"));
  const parsed = parseWorkItemForm(formData);
  if (!projectId.success || !parsed.success)
    return errorState("Revise o projeto, os dados da demanda e a estimativa.");
  try {
    await createWorkItem({
      actorUserId: session.user.id,
      slug,
      projectId: projectId.data,
      ...parsed.data,
    });
    revalidatePath(`/w/${slug}/work`);
    revalidatePath(`/w/${slug}/projects/${projectId.data}`);
    revalidatePath(`/w/${slug}/projects`);
    revalidatePath(`/w/${slug}/insights`);
    return successState("Demanda criada.");
  } catch (error) {
    return mappedError(error);
  }
}

export async function setWorkItemStatusAction(
  slug: string,
  itemId: string,
  status: "TODO" | "IN_PROGRESS" | "DONE",
) {
  const session = await requireCoreSession(`/w/${slug}/work`);
  try {
    await setWorkItemStatus({
      actorUserId: session.user.id,
      slug,
      itemId,
      status,
    });
    revalidatePath(`/w/${slug}/work`);
    revalidatePath(`/w/${slug}/projects`);
    revalidatePath(`/w/${slug}/insights`);
    return successState(
      status === "DONE" ? "Demanda concluída." : "Demanda reaberta.",
    );
  } catch (error) {
    return mappedError(error);
  }
}

export async function moveWorkItemAction(
  slug: string,
  itemId: string,
  targetProjectId: string,
) {
  const session = await requireCoreSession(`/w/${slug}/work`);
  if (!z.uuid().safeParse(targetProjectId).success)
    return errorState("Selecione um projeto válido.");
  try {
    await moveWorkItem({
      actorUserId: session.user.id,
      slug,
      itemId,
      targetProjectId,
    });
    revalidatePath(`/w/${slug}/work`);
    revalidatePath(`/w/${slug}/projects`);
    revalidatePath(`/w/${slug}/insights`);
    return successState("Demanda movida.");
  } catch (error) {
    return mappedError(error);
  }
}

export async function duplicateWorkItemAction(slug: string, itemId: string) {
  const session = await requireCoreSession(`/w/${slug}/work`);
  try {
    await duplicateWorkItem({ actorUserId: session.user.id, slug, itemId });
    revalidatePath(`/w/${slug}/work`);
    revalidatePath(`/w/${slug}/projects`);
    revalidatePath(`/w/${slug}/insights`);
    return successState("Demanda duplicada.");
  } catch (error) {
    return mappedError(error);
  }
}

export async function archiveWorkItemAction(slug: string, itemId: string) {
  const session = await requireCoreSession(`/w/${slug}/work`);
  try {
    await archiveWorkItem({ actorUserId: session.user.id, slug, itemId });
    revalidatePath(`/w/${slug}/work`);
    revalidatePath(`/w/${slug}/projects`);
    revalidatePath(`/w/${slug}/insights`);
    return successState("Demanda arquivada.");
  } catch (error) {
    return mappedError(error);
  }
}

function parseProjectForm(formData: FormData) {
  const result = projectInputSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    status: formData.get("status"),
    estimate: formData.get("estimate"),
  });
  return result.success
    ? {
        success: true as const,
        data: { ...result.data, estimatedMinutes: result.data.estimate },
      }
    : { success: false as const };
}

function parseWorkItemForm(formData: FormData) {
  const result = workItemInputSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    estimate: formData.get("estimate"),
    parentWorkItemId: formData.get("parentWorkItemId"),
  });
  return result.success
    ? {
        success: true as const,
        data: { ...result.data, estimatedMinutes: result.data.estimate },
      }
    : { success: false as const };
}

function mappedError(error: unknown): ProjectActionState {
  if (error instanceof ProjectError)
    return errorState(projectErrorMessage[error.code]);
  if (error instanceof WorkspaceError)
    return errorState("Você não tem permissão para esta ação.");
  logger.error({ error, module: "projects" }, "Project action failed");
  return errorState(
    "Não conseguimos concluir esta ação agora. Tente novamente.",
  );
}

function errorState(message: string): ProjectActionState {
  return { message, status: "error" };
}
function successState(message: string): ProjectActionState {
  return { message, status: "success" };
}
