export type ManualTimeErrorCode =
  | "INVALID_INTERVAL"
  | "FUTURE_INTERVAL"
  | "OVERLAP"
  | "TARGET_NOT_TRACKABLE"
  | "ENTRY_NOT_FOUND"
  | "ENTRY_NOT_EDITABLE"
  | "ENTRY_NOT_ARCHIVABLE"
  | "MULTI_SEGMENT_ENTRY";

export class ManualTimeError extends Error {
  constructor(readonly code: ManualTimeErrorCode) {
    super(code);
  }
}

export const manualTimeErrorMessage: Record<ManualTimeErrorCode, string> = {
  INVALID_INTERVAL: "O horário final deve ser posterior ao horário inicial.",
  FUTURE_INTERVAL: "O período não pode terminar no futuro.",
  OVERLAP: "Parte deste período já possui tempo registrado.",
  TARGET_NOT_TRACKABLE: "Escolha um projeto ou uma demanda disponível.",
  ENTRY_NOT_FOUND: "Este registro não foi encontrado.",
  ENTRY_NOT_EDITABLE:
    "Apenas registros concluídos, já parados, podem ser editados aqui.",
  ENTRY_NOT_ARCHIVABLE: "Só é possível excluir registros já concluídos.",
  MULTI_SEGMENT_ENTRY:
    "Este registro tem pausas e não pode ser alterado por este fluxo sem perder seu histórico.",
};
