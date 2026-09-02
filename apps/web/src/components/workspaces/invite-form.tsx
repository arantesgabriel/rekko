"use client";

import { useActionState } from "react";

import {
  inviteMemberAction,
  type ActionState,
} from "@/modules/workspaces/actions";

const initialActionState: ActionState = { message: "", status: "idle" };

export function InviteForm({
  slug,
  compact = false,
}: {
  slug: string;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    inviteMemberAction.bind(null, slug),
    initialActionState,
  );
  return (
    <form
      action={formAction}
      className={compact ? "invite-form invite-form--compact" : "invite-form"}
    >
      <div className="field-group">
        <label htmlFor={`invite-email-${compact}`}>E-mail</label>
        <input
          id={`invite-email-${compact}`}
          name="email"
          placeholder="pessoa@empresa.com"
          required
          type="email"
        />
      </div>
      <div className="field-group">
        <label htmlFor={`invite-role-${compact}`}>Permissão</label>
        <select defaultValue="MEMBER" id={`invite-role-${compact}`} name="role">
          <option value="MEMBER">Membro</option>
          <option value="ADMIN">Administrador</option>
          <option value="OWNER">Proprietário</option>
        </select>
      </div>
      <div className="field-group">
        <label htmlFor={`invite-job-${compact}`}>Cargo</label>
        <input
          id={`invite-job-${compact}`}
          maxLength={100}
          name="jobTitle"
          placeholder="Ex.: Tech Lead"
        />
      </div>
      <button
        className="button button--primary"
        disabled={pending}
        type="submit"
      >
        {pending ? "Enviando…" : "Enviar convite"}
      </button>
      {state.message && (
        <p
          className={`form-message form-message--${state.status}`}
          role="status"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
