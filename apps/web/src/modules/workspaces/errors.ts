export type WorkspaceErrorCode =
  | "ALREADY_INVITED"
  | "ALREADY_MEMBER"
  | "EMAIL_MISMATCH"
  | "FORBIDDEN"
  | "INVITATION_CANCELLED"
  | "INVITATION_EXPIRED"
  | "INVITATION_INVALID"
  | "INVITATION_USED"
  | "LAST_OWNER"
  | "MEMBER_NOT_FOUND"
  | "WORKSPACE_NOT_FOUND";

export class WorkspaceError extends Error {
  constructor(public readonly code: WorkspaceErrorCode) {
    super(code);
    this.name = "WorkspaceError";
  }
}

export const workspaceErrorMessage: Record<WorkspaceErrorCode, string> = {
  ALREADY_INVITED: "Esta pessoa já possui um convite pendente.",
  ALREADY_MEMBER: "Esta pessoa já faz parte do Workspace.",
  EMAIL_MISMATCH: "Entre com o mesmo email que recebeu o convite.",
  FORBIDDEN: "Você não tem permissão para realizar esta ação.",
  INVITATION_CANCELLED: "Este convite foi cancelado.",
  INVITATION_EXPIRED: "Este convite expirou. Peça um novo envio.",
  INVITATION_INVALID: "Este convite não é válido.",
  INVITATION_USED: "Este convite já foi aceito.",
  LAST_OWNER: "O Workspace precisa continuar com pelo menos um Owner.",
  MEMBER_NOT_FOUND: "Não encontramos este membro no Workspace.",
  WORKSPACE_NOT_FOUND: "Workspace não encontrado.",
};
