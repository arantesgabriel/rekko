export type ProjectErrorCode =
  | "PROJECT_NOT_FOUND"
  | "WORK_ITEM_NOT_FOUND"
  | "PROJECT_ARCHIVED"
  | "INVALID_PARENT"
  | "PARENT_CYCLE";

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
  INVALID_PARENT: "A demanda principal deve pertencer a este projeto.",
  PARENT_CYCLE: "Essa relação criaria um ciclo entre as demandas.",
};
