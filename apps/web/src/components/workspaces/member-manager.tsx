"use client";

import { Fragment, useState, useSyncExternalStore, useTransition } from "react";

import {
  cancelInvitationAction,
  changeJobTitleAction,
  changeRoleAction,
  removeMemberAction,
  resendInvitationAction,
  type ActionState,
} from "@/modules/workspaces/actions";
import {
  workspaceRoleLabel,
  type WorkspaceRole,
} from "@/modules/workspaces/domain";

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

const subscribeToHydration = () => () => undefined;

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
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<ActionState | null>(null);
  const canManage = actorRole !== "MEMBER";
  function run(task: () => Promise<ActionState>): Promise<void> {
    setFeedback(null);
    setBusy(true);
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          setFeedback(await task());
        } finally {
          setBusy(false);
          resolve();
        }
      });
    });
  }
  return (
    <div className="members-list" aria-busy={busy || pending}>
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
        <span>E-mail</span>
        <span>Cargo</span>
        <span>Permissão</span>
        <span>Ações</span>
      </div>
      {members.map((member) => (
        <Fragment key={member.id}>
          <article className="member-row member-row--desktop" key={member.id}>
            <div className="member-identity">
              <span className="member-avatar" aria-hidden="true">
                {member.name.slice(0, 1).toUpperCase()}
              </span>
              <strong>{member.name}</strong>
              <small>Ativo</small>
            </div>
            <span className="member-email">{member.email}</span>
            {canManage ? (
              <form
                className="inline-field"
                onSubmit={(event) => event.preventDefault()}
              >
                <label className="sr-only" htmlFor={`job-${member.id}`}>
                  Cargo de {member.name}
                </label>
                <input
                  defaultValue={member.jobTitle ?? ""}
                  disabled={!hydrated || busy || pending}
                  id={`job-${member.id}`}
                  maxLength={100}
                  name="jobTitle"
                  onBlur={(event) => {
                    const next = event.currentTarget.value.trim();
                    if (next === (member.jobTitle ?? "")) return;
                    const form = event.currentTarget.form;
                    if (form)
                      void run(() =>
                        changeJobTitleAction(
                          slug,
                          member.id,
                          new FormData(form),
                        ),
                      );
                  }}
                  placeholder="Sem cargo"
                />
              </form>
            ) : (
              <span>{member.jobTitle || "—"}</span>
            )}
            {canManage && member.role !== "OWNER" ? (
              <form
                className="inline-field"
                onSubmit={(event) => event.preventDefault()}
              >
                <label className="sr-only" htmlFor={`role-${member.id}`}>
                  Permissão de {member.name}
                </label>
                <select
                  defaultValue={member.role}
                  disabled={!hydrated || busy || pending}
                  id={`role-${member.id}`}
                  name="role"
                  onChange={(event) => {
                    const form = event.currentTarget.form;
                    if (form)
                      void run(() =>
                        changeRoleAction(slug, member.id, new FormData(form)),
                      );
                  }}
                >
                  <option value="MEMBER">{workspaceRoleLabel.MEMBER}</option>
                  <option value="ADMIN">{workspaceRoleLabel.ADMIN}</option>
                  {actorRole === "OWNER" && (
                    <option value="OWNER">{workspaceRoleLabel.OWNER}</option>
                  )}
                </select>
              </form>
            ) : (
              <span className="role-badge">
                {workspaceRoleLabel[member.role]}
              </span>
            )}
            <div className="member-actions">
              {canManage && member.role !== "OWNER" && (
                <details className="row-actions-menu">
                  <summary
                    aria-label={`Mais ações para ${member.name}`}
                    className="button button--ghost button--icon button--sm"
                    title="Mais ações"
                  >
                    <span aria-hidden="true">•••</span>
                  </summary>
                  <div className="row-actions-menu__popover">
                    <button
                      className="button button--destructive"
                      disabled={!hydrated || busy || pending}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remover ${member.name} deste Workspace?`,
                          )
                        )
                          run(() => removeMemberAction(slug, member.id));
                      }}
                      type="button"
                    >
                      Remover membro
                    </button>
                  </div>
                </details>
              )}
            </div>
          </article>
          <article className="member-card" key={`mobile-${member.id}`}>
            <div className="member-card__topline">
              <div className="member-identity">
                <span className="member-avatar" aria-hidden="true">
                  {member.name.slice(0, 1).toUpperCase()}
                </span>
                <strong>{member.name}</strong>
                <small>Ativo</small>
              </div>
              {canManage && member.role !== "OWNER" ? (
                <details className="row-actions-menu">
                  <summary
                    aria-label={`Mais ações para ${member.name}`}
                    className="button button--ghost button--icon button--sm"
                    title="Mais ações"
                  >
                    <span aria-hidden="true">•••</span>
                  </summary>
                  <div className="row-actions-menu__popover">
                    <button
                      className="button button--destructive"
                      disabled={!hydrated || busy || pending}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remover ${member.name} deste Workspace?`,
                          )
                        )
                          run(() => removeMemberAction(slug, member.id));
                      }}
                      type="button"
                    >
                      Remover membro
                    </button>
                  </div>
                </details>
              ) : null}
            </div>
            <div className="member-card__meta">
              <span className="member-email">{member.email}</span>
              <span className="role-badge">
                {workspaceRoleLabel[member.role]}
              </span>
            </div>
            <details className="member-card__edit">
              <summary className="button button--ghost button--sm">
                {canManage ? "Editar cargo e permissão" : "Ver detalhes"}
              </summary>
              <div className="member-card__editor">
                {canManage ? (
                  <form
                    className="inline-field"
                    onSubmit={(event) => event.preventDefault()}
                  >
                    <label htmlFor={`mobile-job-${member.id}`}>Cargo</label>
                    <input
                      defaultValue={member.jobTitle ?? ""}
                      disabled={!hydrated || busy || pending}
                      id={`mobile-job-${member.id}`}
                      maxLength={100}
                      name="jobTitle"
                      onBlur={(event) => {
                        const next = event.currentTarget.value.trim();
                        if (next === (member.jobTitle ?? "")) return;
                        const form = event.currentTarget.form;
                        if (form)
                          void run(() =>
                            changeJobTitleAction(
                              slug,
                              member.id,
                              new FormData(form),
                            ),
                          );
                      }}
                      placeholder="Sem cargo"
                    />
                  </form>
                ) : (
                  <p>
                    <span>Cargo</span>
                    <strong>{member.jobTitle || "Sem cargo"}</strong>
                  </p>
                )}
                {canManage && member.role !== "OWNER" ? (
                  <form
                    className="inline-field"
                    onSubmit={(event) => event.preventDefault()}
                  >
                    <label htmlFor={`mobile-role-${member.id}`}>
                      Permissão
                    </label>
                    <select
                      defaultValue={member.role}
                      disabled={!hydrated || busy || pending}
                      id={`mobile-role-${member.id}`}
                      name="role"
                      onChange={(event) => {
                        const form = event.currentTarget.form;
                        if (form)
                          void run(() =>
                            changeRoleAction(
                              slug,
                              member.id,
                              new FormData(form),
                            ),
                          );
                      }}
                    >
                      <option value="MEMBER">
                        {workspaceRoleLabel.MEMBER}
                      </option>
                      <option value="ADMIN">{workspaceRoleLabel.ADMIN}</option>
                      {actorRole === "OWNER" ? (
                        <option value="OWNER">
                          {workspaceRoleLabel.OWNER}
                        </option>
                      ) : null}
                    </select>
                  </form>
                ) : (
                  <p>
                    <span>Permissão</span>
                    <strong>{workspaceRoleLabel[member.role]}</strong>
                  </p>
                )}
              </div>
            </details>
          </article>
        </Fragment>
      ))}
      {invitations
        .filter((item) => item.status !== "ACCEPTED")
        .map((invitation) => (
          <Fragment key={invitation.id}>
            <article
              className="member-row member-row--invitation member-row--desktop"
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
              <span className="role-badge">
                {workspaceRoleLabel[invitation.role]}
              </span>
              <div className="member-actions">
                {canManage && invitation.status !== "CANCELLED" && (
                  <>
                    <button
                      className="button button--link"
                      disabled={!hydrated || busy || pending}
                      onClick={() =>
                        run(() => resendInvitationAction(slug, invitation.id))
                      }
                      type="button"
                    >
                      Reenviar
                    </button>
                    <button
                      className="button button--link button--destructive"
                      disabled={!hydrated || busy || pending}
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
            <article
              className="member-card member-card--invitation"
              key={`mobile-${invitation.id}`}
            >
              <div className="member-card__topline">
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
                <span className="role-badge">
                  {workspaceRoleLabel[invitation.role]}
                </span>
              </div>
              <div className="member-card__meta">
                <span className="member-email">{invitation.email}</span>
                <span>{invitation.jobTitle || "Sem cargo"}</span>
              </div>
              {canManage && invitation.status !== "CANCELLED" ? (
                <div className="member-card__actions">
                  <button
                    className="button button--ghost button--sm"
                    disabled={!hydrated || busy || pending}
                    onClick={() =>
                      run(() => resendInvitationAction(slug, invitation.id))
                    }
                    type="button"
                  >
                    Reenviar
                  </button>
                  <button
                    className="button button--ghost button--sm button--destructive"
                    disabled={!hydrated || busy || pending}
                    onClick={() =>
                      run(() => cancelInvitationAction(slug, invitation.id))
                    }
                    type="button"
                  >
                    Cancelar
                  </button>
                </div>
              ) : null}
            </article>
          </Fragment>
        ))}
    </div>
  );
}

function statusLabel(status: Invitation["status"]) {
  return status === "PENDING"
    ? "Convite pendente"
    : status === "EXPIRED"
      ? "Expirado"
      : "Cancelado";
}
