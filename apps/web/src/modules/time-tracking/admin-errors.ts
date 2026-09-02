export type AdminTimeErrorCode =
  | "INVALID_INTERVAL"
  | "FUTURE_INTERVAL"
  | "OVERLAP"
  | "ENTRY_NOT_FOUND"
  | "OWN_ENTRY"
  | "ENTRY_NOT_CORRECTABLE"
  | "ENTRY_NOT_ARCHIVABLE"
  | "MULTI_SEGMENT_ENTRY"
  | "TARGET_NOT_FOUND";

export class AdminTimeError extends Error {
  constructor(readonly code: AdminTimeErrorCode) {
    super(code);
    this.name = "AdminTimeError";
  }
}

export const adminTimeErrorMessage: Record<AdminTimeErrorCode, string> = {
  INVALID_INTERVAL: "O horário final precisa ser posterior ao inicial.",
  FUTURE_INTERVAL: "O período não pode terminar no futuro.",
  OVERLAP: "Parte deste período já possui tempo registrado.",
  ENTRY_NOT_FOUND: "Este registro não foi encontrado.",
  OWN_ENTRY: "Para seu próprio tempo, use a edição manual da Timeline.",
  ENTRY_NOT_CORRECTABLE:
    "Apenas registros concluídos com uma sessão contínua podem ser corrigidos aqui.",
  ENTRY_NOT_ARCHIVABLE: "Só é possível arquivar registros concluídos.",
  MULTI_SEGMENT_ENTRY:
    "Este registro tem pausas e não pode ser alterado por este fluxo sem perder seu histórico.",
  TARGET_NOT_FOUND: "Escolha um projeto e uma demanda válidos.",
};
