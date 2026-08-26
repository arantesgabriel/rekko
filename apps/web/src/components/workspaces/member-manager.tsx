"use client";

import { useState, useTransition } from "react";

import {
  cancelInvitationAction,
  changeJobTitleAction,
  changeRoleAction,
  removeMemberAction,
  resendInvitationAction,
  type ActionState,
} from "@/modules/workspaces/actions";
import type { WorkspaceRole } from "@/modules/workspaces/domain";

type Member = {
  id: string;
  userId: string;
  name: string;
  email: string;
  jobTitle: string | null;
  role: WorkspaceRole;
};
type Invitation = {
  id: string;
  email: string;
  jobTitle: string | null;
  role: WorkspaceRole;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "CANCELLED";
};

export function MemberManager({
  actorRole,
  invitations,
  members,
  slug,
}: {
  actorRole: WorkspaceRole;
  invitations: Invitation[];
  members: Member[];
  slug: string;
}) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<ActionState | null>(null);
  const canManage = actorRole !== "MEMBER";
  function run(task: () => Promise<ActionState>) {
    setFeedback(null);
    startTransition(async () => setFeedback(await task()));
  }
  return (
    <div className="members-list" aria-busy={pending}>
      {feedback?.message && (
        <p
          className={`form-message form-message--${feedback.status}`}
          role="status"
        >
          {feedback.message}
        </p>
      )}
      <div className="members-list__header" aria-hidden="true">
        <span>Nome</span>
        <span>Email</span>
        <span>Cargo</span>
        <span>Role</span>
        <span>Ações</span>
      </div>
      {members.map((member) => (
        <article className="member-row" key={member.id}>
          <div className="member-identity">
            <span className="member-avatar" aria-hidden="true">
              {member.name.slice(0, 1).toUpperCase()}
            </span>
            <strong>{member.name}</strong>
            <small>Active</small>
          </div>
          <span className="member-email">{member.email}</span>
          {canManage ? (
            <form
              action={(data) =>
                run(() => changeJobTitleAction(slug, member.id, data))
              }
              className="inline-field"
            >
              <label className="sr-only" htmlFor={`job-${member.id}`}>
                Cargo de {member.name}
              </label>
              <input
                defaultValue={member.jobTitle ?? ""}
                disabled={pending}
                id={`job-${member.id}`}
                maxLength={100}
                name="jobTitle"
                placeholder="Sem cargo"
              />
              <button disabled={pending} type="submit">
                Salvar
              </button>
            </form>
          ) : (
            <span>{member.jobTitle || "—"}</span>
          )}
          {canManage ? (
            <form
              action={(data) =>
                run(() => changeRoleAction(slug, member.id, data))
              }
              className="inline-field"
            >
              <label className="sr-only" htmlFor={`role-${member.id}`}>
                Role de {member.name}
              </label>
              <select
                defaultValue={member.role}
                disabled={pending}
                id={`role-${member.id}`}
                name="role"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
                {actorRole === "OWNER" && <option value="OWNER">Owner</option>}
              </select>
              <button disabled={pending} type="submit">
                Salvar
              </button>
            </form>
          ) : (
            <span className="role-badge">{roleLabel(member.role)}</span>
          )}
          <div className="member-actions">
            {canManage && (
              <button
                className="danger-link"
                disabled={pending}
                onClick={() => {
                  if (window.confirm(`Remover ${member.name} deste Workspace?`))
                    run(() => removeMemberAction(slug, member.id));
                }}
                type="button"
              >
                Remover
              </button>
            )}
          </div>
        </article>
      ))}
      {invitations
        .filter((item) => item.status !== "ACCEPTED")
        .map((invitation) => (
          <article
            className="member-row member-row--invitation"
            key={invitation.id}
          >
            <div className="member-identity">
              <span
                className="member-avatar member-avatar--pending"
                aria-hidden="true"
              >
                ?
              </span>
              <strong>Convite pendente</strong>
              <small>{statusLabel(invitation.status)}</small>
            </div>
            <span className="member-email">{invitation.email}</span>
            <span>{invitation.jobTitle || "—"}</span>
            <span className="role-badge">{roleLabel(invitation.role)}</span>
            <div className="member-actions">
              {canManage && invitation.status !== "CANCELLED" && (
                <>
                  <button
                    disabled={pending}
                    onClick={() =>
                      run(() => resendInvitationAction(slug, invitation.id))
                    }
                    type="button"
                  >
                    Reenviar
                  </button>
                  <button
                    className="danger-link"
                    disabled={pending}
                    onClick={() =>
                      run(() => cancelInvitationAction(slug, invitation.id))
                    }
                    type="button"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
    </div>
  );
}

function roleLabel(role: WorkspaceRole) {
  return role === "OWNER" ? "Owner" : role === "ADMIN" ? "Admin" : "Member";
}
function statusLabel(status: Invitation["status"]) {
  return status === "PENDING"
    ? "Pending invitation"
    : status === "EXPIRED"
      ? "Expired"
      : "Cancelled";
}
