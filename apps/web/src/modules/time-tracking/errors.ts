export type TimerErrorCode =
  | "ACTIVE_TIMER_EXISTS"
  | "NO_ACTIVE_TIMER"
  | "TIMER_NOT_RUNNING"
  | "TIMER_NOT_PAUSED"
  | "TARGET_NOT_TRACKABLE";

export class TimerError extends Error {
  constructor(readonly code: TimerErrorCode) {
    super(code);
    this.name = "TimerError";
  }
}

export const timerErrorMessage: Record<TimerErrorCode, string> = {
  ACTIVE_TIMER_EXISTS: "Você já tem uma atividade em andamento.",
  NO_ACTIVE_TIMER: "Nenhuma atividade em andamento.",
  TIMER_NOT_RUNNING: "Esta atividade não está em execução.",
  TIMER_NOT_PAUSED: "Esta atividade não está pausada.",
  TARGET_NOT_TRACKABLE:
    "Esta atividade não está disponível para registro de tempo.",
};
