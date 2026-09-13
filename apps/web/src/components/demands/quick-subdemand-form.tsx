"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  createDemandDrawerAction,
  type ProjectActionState,
} from "@/modules/projects/actions";

const initialState: ProjectActionState = { message: "", status: "idle" };

export function QuickSubdemandForm({
  onCancel,
  onCreated,
  parentId,
  projectId,
  slug,
}: {
  onCancel: () => void;
  onCreated: (demandId?: string) => void;
  parentId: string;
  projectId: string;
  slug: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState(
    createDemandDrawerAction.bind(null, slug),
    initialState,
  );

  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
    inputRef.current?.focus();
    onCreated(state.createdDemandId);
  }, [onCreated, state.createdDemandId, state.status]);

  return (
    <form
      action={formAction}
      className="quick-subdemand"
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        onCancel();
      }}
      ref={formRef}
    >
      <input name="projectId" type="hidden" value={projectId} />
      <input name="parentMode" type="hidden" value="EXISTING" />
      <input name="parentWorkItemId" type="hidden" value={parentId} />
      <input name="description" type="hidden" value="" />
      <input name="status" type="hidden" value="TODO" />
      <input name="estimate" type="hidden" value="" />
      <span aria-hidden="true" className="quick-subdemand__mark" />
      <input
        aria-label="Título da nova subdemanda"
        autoComplete="off"
        autoFocus
        disabled={pending}
        maxLength={180}
        minLength={2}
        name="title"
        placeholder="Digite o título da subdemanda…"
        ref={inputRef}
        required
      />
      <button className="button button--ghost button--sm" disabled={pending}>
        {pending ? "Criando…" : "Adicionar"}
      </button>
      {state.status === "error" ? (
        <p className="quick-subdemand__error" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
