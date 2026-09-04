"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCoreSession } from "@/modules/auth/session";
import { archiveTimeEntry } from "@/modules/time-tracking/admin-service";
import {
  AdminTimeError,
  adminTimeErrorMessage,
} from "@/modules/time-tracking/admin-errors";
import { WorkspaceError } from "@/modules/workspaces/errors";
import { requireWorkspace } from "@/modules/workspaces/service";
import { localDateTimeToUtc, zonedDateTimeToUtc } from "./domain";
import { ManualTimeError, manualTimeErrorMessage } from "./errors";
import { manualTimeInputSchema, ownTimeEntryIntervalSchema } from "./schemas";
import {
  getDailyTimeline,
  saveManualTime,
  updateOwnTimeEntry,
} from "./service";

export type ManualTimeActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

function revalidateTrackedTime(slug: string) {
  revalidatePath("/w", "layout");
  revalidatePath(`/w/${slug}`);
  revalidatePath(`/w/${slug}/work`);
  revalidatePath(`/w/${slug}/projects`);
  revalidatePath(`/w/${slug}/insights`);
  revalidatePath(`/w/${slug}/reports`);
}

function mapTimeError(error: unknown): ManualTimeActionState {
  if (error instanceof ManualTimeError)
    return { status: "error", message: manualTimeErrorMessage[error.code] };
  if (error instanceof AdminTimeError)
    return { status: "error", message: adminTimeErrorMessage[error.code] };
  if (error instanceof WorkspaceError)
    return {
      status: "error",
      message: "Você não tem permissão para alterar este registro.",
    };
  if (error instanceof RangeError)
    return {
      status: "error",
      message: "Este horário não existe na timezone do Workspace.",
    };
  return {
    status: "error",
    message: "Não conseguimos salvar o período. Tente novamente.",
  };
}

export async function saveManualTimeAction(
  slug: string,
  previous: ManualTimeActionState,
  formData: FormData,
): Promise<ManualTimeActionState> {
  void previous;
  const session = await requireCoreSession(`/w/${slug}`);
  const parsed = manualTimeInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { status: "error", message: "Revise os campos do período." };
  try {
    const timeline = await getDailyTimeline({
      userId: session.user.id,
      slug,
      date: parsed.data.date,
    });
    const start = zonedDateTimeToUtc(
      `${parsed.data.date}T${parsed.data.startTime}:00`,
      timeline.timezone,
    );
    let end = zonedDateTimeToUtc(
      `${parsed.data.date}T${parsed.data.endTime}:00`,
      timeline.timezone,
    );
    if (end <= start && parsed.data.endTime !== parsed.data.startTime) {
      const next = new Date(start.getTime() + 36 * 60 * 60 * 1000);
      const nextDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: timeline.timezone,
      }).format(next);
      end = zonedDateTimeToUtc(
        `${nextDate}T${parsed.data.endTime}:00`,
        timeline.timezone,
      );
    }
    await saveManualTime({
      actorUserId: session.user.id,
      slug,
      entryId: parsed.data.entryId,
      start,
      end,
      projectId: parsed.data.projectId,
      workItemId: parsed.data.workItemId,
      description: parsed.data.description,
    });
    revalidateTrackedTime(slug);
    return {
      status: "success",
      message: parsed.data.entryId ? "Tempo atualizado." : "Tempo adicionado.",
    };
  } catch (error) {
    return mapTimeError(error);
  }
}

export async function updateOwnTimeEntryAction(
  slug: string,
  entryId: string,
  previous: ManualTimeActionState,
  formData: FormData,
): Promise<ManualTimeActionState> {
  void previous;
  const session = await requireCoreSession(`/w/${slug}`);
  if (!z.uuid().safeParse(entryId).success)
    return { status: "error", message: "Este registro não foi encontrado." };
  const parsed = ownTimeEntryIntervalSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success)
    return { status: "error", message: "Revise os campos do período." };
  try {
    const context = await requireWorkspace(session.user.id, slug);
    const start = localDateTimeToUtc(
      parsed.data.startDate,
      parsed.data.startTime,
      context.timezone,
    );
    const end = localDateTimeToUtc(
      parsed.data.endDate,
      parsed.data.endTime,
      context.timezone,
    );
    await updateOwnTimeEntry({
      actorUserId: session.user.id,
      slug,
      entryId,
      start,
      end,
    });
    revalidateTrackedTime(slug);
    return { status: "success", message: "Registro atualizado" };
  } catch (error) {
    return mapTimeError(error);
  }
}

export async function deleteOwnTimeEntryAction(
  slug: string,
  entryId: string,
): Promise<ManualTimeActionState> {
  const session = await requireCoreSession(`/w/${slug}`);
  if (!z.uuid().safeParse(entryId).success)
    return { status: "error", message: "Este registro não foi encontrado." };
  try {
    await archiveTimeEntry({
      actorUserId: session.user.id,
      slug,
      entryId,
    });
    revalidateTrackedTime(slug);
    return { status: "success", message: "Registro excluído" };
  } catch (error) {
    return mapTimeError(error);
  }
}
