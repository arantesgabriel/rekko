"use server";

import { revalidatePath } from "next/cache";
import { requireCoreSession } from "@/modules/auth/session";
import { TimerError, timerErrorMessage } from "./errors";
import {
  finishTimer,
  pauseTimer,
  resumeTimer,
  startTimer,
  switchTimer,
} from "./service";

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
  workItemId: string | null,
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
  workItemId: string | null,
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
