export type ProjectErrorCode =
  | "PROJECT_NOT_FOUND"
  | "WORK_ITEM_NOT_FOUND"
  | "PROJECT_ARCHIVED"
  | "SOURCE_READ_ONLY"
  | "INVALID_PARENT"
  | "PARENT_CYCLE"
  | "WORK_ITEM_HAS_ACTIVE_TIMER";

export class ProjectError extends Error {
  constructor(readonly code: ProjectErrorCode) {
    super(code);
    this.name = "ProjectError";
  }
}

export const projectErrorMessage: Record<ProjectErrorCode, string> = {
  PROJECT_NOT_FOUND: "Projeto não encontrado.",
  WORK_ITEM_NOT_FOUND: "Demanda não encontrada.",
  PROJECT_ARCHIVED: "Este projeto está arquivado e não pode ser alterado.",
  SOURCE_READ_ONLY: "Esta demanda é atualizada pelo Linear.",
  INVALID_PARENT: "A demanda principal deve pertencer a este projeto.",
  PARENT_CYCLE: "Essa relação criaria um ciclo entre as demandas.",
  WORK_ITEM_HAS_ACTIVE_TIMER:
    "Finalize ou pause o tempo desta demanda antes de arquivá-la.",
};
