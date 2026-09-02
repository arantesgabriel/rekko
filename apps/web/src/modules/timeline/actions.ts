"use server";

import { revalidatePath } from "next/cache";
import { requireCoreSession } from "@/modules/auth/session";
import { zonedDateTimeToUtc } from "./domain";
import { ManualTimeError, manualTimeErrorMessage } from "./errors";
import { manualTimeInputSchema } from "./schemas";
import { getDailyTimeline, saveManualTime } from "./service";

export type ManualTimeActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

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
    revalidatePath(`/w/${slug}`);
    revalidatePath(`/w/${slug}/insights`);
    return {
      status: "success",
      message: parsed.data.entryId ? "Tempo atualizado." : "Tempo adicionado.",
    };
  } catch (error) {
    if (error instanceof ManualTimeError)
      return { status: "error", message: manualTimeErrorMessage[error.code] };
    if (error instanceof RangeError)
      return {
        status: "error",
        message: "Este horário não existe na sua timezone.",
      };
    return {
      status: "error",
      message: "Não conseguimos salvar o período. Tente novamente.",
    };
  }
}
