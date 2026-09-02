export type ManualTimeErrorCode =
  | "INVALID_INTERVAL"
  | "FUTURE_INTERVAL"
  | "OVERLAP"
  | "TARGET_NOT_TRACKABLE"
  | "ENTRY_NOT_FOUND"
  | "ENTRY_NOT_EDITABLE";

export class ManualTimeError extends Error {
  constructor(readonly code: ManualTimeErrorCode) {
    super(code);
  }
}

export const manualTimeErrorMessage: Record<ManualTimeErrorCode, string> = {
  INVALID_INTERVAL: "O horário final precisa ser posterior ao inicial.",
  FUTURE_INTERVAL: "O período não pode terminar no futuro.",
  OVERLAP: "Parte deste período já possui tempo registrado.",
  TARGET_NOT_TRACKABLE: "Escolha um projeto ou uma demanda disponível.",
  ENTRY_NOT_FOUND: "Este registro não foi encontrado.",
  ENTRY_NOT_EDITABLE: "Apenas seus lançamentos manuais podem ser editados.",
};
