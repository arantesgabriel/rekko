"use server";

import { revalidatePath } from "next/cache";

import { requireCoreSession } from "@/modules/auth/session";
import { WorkspaceError } from "@/modules/workspaces/errors";
import { requireWorkspace } from "@/modules/workspaces/service";
import { accountSettingsSchema, workspaceSettingsSchema } from "./schemas";
import { updateAccountSettings, updateWorkspaceSettings } from "./service";

export type SettingsActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export async function updateAccountSettingsAction(
  slug: string,
  previous: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  void previous;
  const session = await requireCoreSession(`/w/${slug}/settings`);
  const parsed = accountSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { status: "error", message: "Revise o nome e a timezone." };
  try {
    await requireWorkspace(session.user.id, slug);
    await updateAccountSettings({ userId: session.user.id, ...parsed.data });
    revalidatePath(`/w/${slug}`, "layout");
    return {
      status: "success",
      message: "Configurações da conta atualizadas.",
    };
  } catch (error) {
    return settingsActionError(error, "Não conseguimos salvar sua conta.");
  }
}

export async function updateWorkspaceSettingsAction(
  slug: string,
  previous: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  void previous;
  const session = await requireCoreSession(`/w/${slug}/settings`);
  const parsed = workspaceSettingsSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success)
    return { status: "error", message: "Revise o nome e a timezone." };
  try {
    await updateWorkspaceSettings({
      actorUserId: session.user.id,
      slug,
      ...parsed.data,
    });
    revalidatePath(`/w/${slug}`, "layout");
    return {
      status: "success",
      message: "Configurações do Workspace atualizadas.",
    };
  } catch (error) {
    return settingsActionError(error, "Não conseguimos salvar o Workspace.");
  }
}

function settingsActionError(
  error: unknown,
  fallback: string,
): SettingsActionState {
  if (error instanceof WorkspaceError && error.code === "FORBIDDEN")
    return {
      status: "error",
      message: "Você não tem permissão para editar estas configurações.",
    };
  if (error instanceof WorkspaceError)
    return { status: "error", message: "Workspace não encontrado." };
  if (error instanceof RangeError)
    return { status: "error", message: "Escolha uma timezone válida." };
  return { status: "error", message: fallback };
}
