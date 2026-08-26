"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseServerEnv } from "@rekko/shared/env";

import { logger } from "@/lib/logger";
import { createEmailService } from "@/modules/auth/email-service";
import { requireCoreSession } from "@/modules/auth/session";

import { workspaceErrorMessage, WorkspaceError } from "./errors";
import {
  createWorkspaceSchema,
  invitationSchema,
  jobTitleSchema,
  roleSchema,
} from "./schemas";
import {
  acceptInvitation,
  cancelInvitation,
  changeMemberJobTitle,
  changeMemberRole,
  createInvitation,
  createWorkspace,
  getUserTimezone,
  removeMember,
  resendInvitation,
} from "./service";

export type ActionState = {
  message: string;
  status: "error" | "idle" | "success" | "warning";
};

export async function createWorkspaceAction(
  _state: ActionState,
  formData: FormData,
) {
  const session = await requireCoreSession("/app");
  const timezone = await getUserTimezone(session.user.id);
  const parsed = createWorkspaceSchema.safeParse({
    name: formData.get("name"),
    timezone: formData.get("timezone") || timezone,
  });
  if (!parsed.success)
    return errorState("Informe um nome válido e uma timezone IANA.");
  const created = await createWorkspace({
    userId: session.user.id,
    ...parsed.data,
  });
  redirect(`/onboarding/${created.slug}/invite`);
}

export async function inviteMemberAction(
  slug: string,
  _state: ActionState,
  formData: FormData,
) {
  const session = await requireCoreSession(`/w/${slug}/members`);
  const parsed = invitationSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
    jobTitle: formData.get("jobTitle"),
  });
  if (!parsed.success) return errorState("Revise o email, a role e o cargo.");
  try {
    const invitation = await createInvitation({
      actorUserId: session.user.id,
      slug,
      ...parsed.data,
    });
    const sent = await sendInvitationEmail({
      email: parsed.data.email,
      invitedByName: session.user.name,
      role: parsed.data.role,
      token: invitation.token,
      workspaceName: invitation.workspaceName,
    });
    revalidatePath(`/w/${slug}/members`);
    return sent
      ? successState("Convite enviado.")
      : warningState(
          "Convite criado, mas o email não foi enviado. Você pode reenviar.",
        );
  } catch (error) {
    return mappedError(error);
  }
}

export async function resendInvitationAction(
  slug: string,
  invitationId: string,
) {
  const session = await requireCoreSession(`/w/${slug}/members`);
  try {
    const invitation = await resendInvitation({
      actorUserId: session.user.id,
      invitationId,
      slug,
    });
    const sent = await sendInvitationEmail({
      email: invitation.email,
      invitedByName: session.user.name,
      role: invitation.role,
      token: invitation.token,
      workspaceName: invitation.workspaceName,
    });
    revalidatePath(`/w/${slug}/members`);
    return sent
      ? successState("Convite reenviado. O link anterior não funciona mais.")
      : warningState(
          "Token renovado, mas o email não foi enviado. Tente reenviar novamente.",
        );
  } catch (error) {
    return mappedError(error);
  }
}

export async function cancelInvitationAction(
  slug: string,
  invitationId: string,
) {
  const session = await requireCoreSession(`/w/${slug}/members`);
  try {
    await cancelInvitation({
      actorUserId: session.user.id,
      invitationId,
      slug,
    });
    revalidatePath(`/w/${slug}/members`);
    return successState("Convite cancelado.");
  } catch (error) {
    return mappedError(error);
  }
}

export async function changeRoleAction(
  slug: string,
  memberId: string,
  formData: FormData,
) {
  const session = await requireCoreSession(`/w/${slug}/members`);
  const parsed = roleSchema.safeParse({ role: formData.get("role") });
  if (!parsed.success) return errorState("Selecione uma role válida.");
  try {
    await changeMemberRole({
      actorUserId: session.user.id,
      memberId,
      nextRole: parsed.data.role,
      slug,
    });
    revalidatePath(`/w/${slug}/members`);
    return successState("Role atualizada.");
  } catch (error) {
    return mappedError(error);
  }
}

export async function changeJobTitleAction(
  slug: string,
  memberId: string,
  formData: FormData,
) {
  const session = await requireCoreSession(`/w/${slug}/members`);
  const parsed = jobTitleSchema.safeParse({
    jobTitle: formData.get("jobTitle"),
  });
  if (!parsed.success)
    return errorState("O cargo deve ter no máximo 100 caracteres.");
  try {
    await changeMemberJobTitle({
      actorUserId: session.user.id,
      jobTitle: parsed.data.jobTitle,
      memberId,
      slug,
    });
    revalidatePath(`/w/${slug}/members`);
    return successState("Cargo atualizado.");
  } catch (error) {
    return mappedError(error);
  }
}

export async function removeMemberAction(slug: string, memberId: string) {
  const session = await requireCoreSession(`/w/${slug}/members`);
  try {
    await removeMember({ actorUserId: session.user.id, memberId, slug });
    revalidatePath(`/w/${slug}/members`);
    return successState("Membro removido.");
  } catch (error) {
    return mappedError(error);
  }
}

export async function acceptInvitationAction(token: string) {
  const session = await requireCoreSession(`/invite/${token}`);
  let destination: { slug: string };
  try {
    destination = await acceptInvitation({
      token,
      userEmail: session.user.email,
      userId: session.user.id,
    });
  } catch (error) {
    return mappedError(error);
  }
  redirect(`/w/${destination.slug}`);
}

async function sendInvitationEmail(input: {
  email: string;
  invitedByName: string;
  role: string;
  token: string;
  workspaceName: string;
}) {
  const env = parseServerEnv(process.env);
  const emailService = createEmailService({
    apiKey: env.RESEND_API_KEY,
    from: env.RESEND_FROM_EMAIL,
    production: env.NODE_ENV === "production",
  });
  try {
    await emailService.sendWorkspaceInvitation({
      email: input.email,
      invitedByName: input.invitedByName,
      role: input.role,
      url: new URL(
        `/invite/${input.token}`,
        env.NEXT_PUBLIC_APP_URL,
      ).toString(),
      workspaceName: input.workspaceName,
    });
    return true;
  } catch (error) {
    logger.error(
      { error, module: "invitations", operation: "send_workspace_invitation" },
      "Workspace invitation email failed",
    );
    return false;
  }
}

function mappedError(error: unknown): ActionState {
  if (error instanceof WorkspaceError)
    return errorState(workspaceErrorMessage[error.code]);
  logger.error({ error, module: "workspaces" }, "Workspace action failed");
  return errorState(
    "Não conseguimos concluir esta ação agora. Tente novamente.",
  );
}

function errorState(message: string): ActionState {
  return { message, status: "error" };
}
function successState(message: string): ActionState {
  return { message, status: "success" };
}
function warningState(message: string): ActionState {
  return { message, status: "warning" };
}
