"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCoreSession } from "@/modules/auth/session";
import { zonedDateTimeToUtc } from "@/modules/timeline/domain";
import { requireWorkspace } from "@/modules/workspaces/service";
import { WorkspaceError } from "@/modules/workspaces/errors";
import { AdminTimeError, adminTimeErrorMessage } from "./admin-errors";
import { timeEntryCorrectionSchema } from "./admin-schemas";
import { TimerError, timerErrorMessage } from "./errors";
import {
  finishTimer,
  pauseTimer,
  resumeTimer,
  startTimer,
  switchTimer,
} from "./service";
import { archiveTimeEntry, correctTimeEntry } from "./admin-service";

export type TimerActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

async function run(
  operation: (userId: string) => Promise<unknown>,
): Promise<TimerActionState> {
  const session = await requireCoreSession();
  try {
    await operation(session.user.id);
    revalidatePath("/w", "layout");
    return { status: "success", message: "Timer atualizado." };
  } catch (error) {
    if (error instanceof TimerError)
      return { status: "error", message: timerErrorMessage[error.code] };
    return {
      status: "error",
      message: "Não conseguimos atualizar o timer. Tente novamente.",
    };
  }
}

export async function startTimerAction(
  slug: string,
  projectId: string,
  workItemId: string,
  state: TimerActionState,
) {
  void state;
  return run((actorUserId) =>
    startTimer({ actorUserId, slug, projectId, workItemId }),
  );
}
export async function switchTimerAction(
  slug: string,
  projectId: string,
  workItemId: string,
  state: TimerActionState,
) {
  void state;
  return run((actorUserId) =>
    switchTimer({ actorUserId, slug, projectId, workItemId }),
  );
}
export async function pauseTimerAction(state: TimerActionState) {
  void state;
  return run(pauseTimer);
}
export async function resumeTimerAction(state: TimerActionState) {
  void state;
  return run(resumeTimer);
}
export async function finishTimerAction(state: TimerActionState) {
  void state;
  return run(finishTimer);
}

export type AdminTimeActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export async function correctTimeEntryAction(
  slug: string,
  entryId: string,
  previous: AdminTimeActionState,
  formData: FormData,
): Promise<AdminTimeActionState> {
  void previous;
  const session = await requireCoreSession(`/w/${slug}/reports`);
  if (!z.uuid().safeParse(entryId).success)
    return { status: "error", message: "Este registro não foi encontrado." };
  const parsed = timeEntryCorrectionSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success)
    return { status: "error", message: "Revise os campos do período." };
  try {
    const context = await requireWorkspace(session.user.id, slug);
    const start = zonedDateTimeToUtc(
      `${parsed.data.date}T${parsed.data.startTime}:00`,
      context.timezone,
    );
    const end = zonedDateTimeToUtc(
      `${parsed.data.date}T${parsed.data.endTime}:00`,
      context.timezone,
    );
    await correctTimeEntry({
      actorUserId: session.user.id,
      slug,
      entryId,
      start,
      end,
      projectId: parsed.data.projectId,
      workItemId: parsed.data.workItemId,
      description: parsed.data.description,
    });
    revalidateTimeEntryPaths(slug);
    return { status: "success", message: "Tempo corrigido." };
  } catch (error) {
    if (error instanceof AdminTimeError)
      return { status: "error", message: adminTimeErrorMessage[error.code] };
    if (error instanceof WorkspaceError)
      return {
        status: "error",
        message: "Você não tem permissão para corrigir este registro.",
      };
    if (error instanceof RangeError)
      return {
        status: "error",
        message: "Este horário não existe na timezone do Workspace.",
      };
    return {
      status: "error",
      message: "Não conseguimos corrigir o período. Tente novamente.",
    };
  }
}

export async function archiveTimeEntryAction(
  slug: string,
  entryId: string,
  previous: AdminTimeActionState,
): Promise<AdminTimeActionState> {
  void previous;
  const session = await requireCoreSession(`/w/${slug}/reports`);
  if (!z.uuid().safeParse(entryId).success)
    return { status: "error", message: "Este registro não foi encontrado." };
  try {
    await archiveTimeEntry({
      actorUserId: session.user.id,
      slug,
      entryId,
    });
    revalidateTimeEntryPaths(slug);
    return { status: "success", message: "Registro arquivado." };
  } catch (error) {
    if (error instanceof AdminTimeError)
      return { status: "error", message: adminTimeErrorMessage[error.code] };
    if (error instanceof WorkspaceError)
      return {
        status: "error",
        message: "Você não tem permissão para arquivar este registro.",
      };
    return {
      status: "error",
      message: "Não conseguimos arquivar o registro. Tente novamente.",
    };
  }
}

function revalidateTimeEntryPaths(slug: string) {
  revalidatePath(`/w/${slug}`);
  revalidatePath(`/w/${slug}/reports`);
  revalidatePath(`/w/${slug}/insights`);
}
