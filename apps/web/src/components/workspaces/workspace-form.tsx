"use client";

import { useActionState } from "react";

import {
  createWorkspaceAction,
  type ActionState,
} from "@/modules/workspaces/actions";

const initialActionState: ActionState = { message: "", status: "idle" };

export function WorkspaceForm() {
  const [state, action, pending] = useActionState(
    createWorkspaceAction,
    initialActionState,
  );
  return (
    <form action={action} className="onboarding-form">
      <label htmlFor="workspace-name">Nome do Workspace</label>
      <input
        autoComplete="organization"
        autoFocus
        id="workspace-name"
        maxLength={80}
        minLength={2}
        name="name"
        placeholder="Ex.: AidCrusader"
        required
      />
      {state.message && (
        <p
          className={`form-message form-message--${state.status}`}
          role="alert"
        >
          {state.message}
        </p>
      )}
      <button
        className="button button--primary"
        disabled={pending}
        type="submit"
      >
        {pending ? "Criando Workspace…" : "Criar Workspace"}
      </button>
    </form>
  );
}
