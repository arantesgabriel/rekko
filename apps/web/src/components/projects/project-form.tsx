"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  createProjectAction,
  createProjectDrawerAction,
  type ProjectActionState,
  updateProjectAction,
} from "@/modules/projects/actions";
import { formatEstimate } from "@/modules/projects/domain";

const initialState: ProjectActionState = { message: "", status: "idle" };

type ProjectValues = {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "COMPLETED";
  estimatedMinutes: number | null;
};

export function ProjectForm({
  drawer = false,
  onCancel,
  onDirtyChange,
  onSuccess,
  slug,
  project,
}: {
  slug: string;
  project?: ProjectValues;
  drawer?: boolean;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const action = project
    ? updateProjectAction.bind(null, slug, project.id)
    : drawer
      ? createProjectDrawerAction.bind(null, slug)
      : createProjectAction.bind(null, slug);
  const [state, formAction, pending] = useActionState(action, initialState);
  useEffect(() => {
    if (state.status !== "success") return;
    router.refresh();
    onSuccess?.();
  }, [onSuccess, router, state.status]);
  return (
    <form
      action={formAction}
      className={`work-form${drawer ? " drawer-form" : ""}`}
      onChange={drawer ? () => onDirtyChange?.(true) : undefined}
    >
      <div className="form-grid">
        <label className="form-control form-control--wide">
          <span>Nome *</span>
          <input
            autoFocus={!project}
            defaultValue={project?.name}
            maxLength={100}
            minLength={2}
            name="name"
            required
          />
        </label>
        <label className="form-control form-control--wide">
          <span>Descrição</span>
          <textarea
            defaultValue={project?.description ?? ""}
            maxLength={2000}
            name="description"
            rows={3}
          />
        </label>
        <label className="form-control">
          <span>Status</span>
          <select defaultValue={project?.status ?? "ACTIVE"} name="status">
            <option value="ACTIVE">Ativo</option>
            <option value="COMPLETED">Concluído</option>
          </select>
        </label>
        <label className="form-control">
          <span>Estimativa total</span>
          <input
            defaultValue={
              project?.estimatedMinutes
                ? formatEstimate(project.estimatedMinutes)
                : ""
            }
            inputMode="text"
            name="estimate"
            placeholder="Ex.: 40h ou 12h 30m"
          />
        </label>
      </div>
      {state.message && (
        <p
          className={`form-message form-message--${state.status}`}
          role="status"
        >
          {state.message}
        </p>
      )}
      {drawer ? (
        <div className="drawer-form__footer">
          <button
            className="button button--secondary"
            onClick={onCancel ?? onSuccess}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="button button--primary"
            disabled={pending}
            type="submit"
          >
            {pending
              ? "Salvando…"
              : project
                ? "Salvar alterações"
                : "Criar projeto"}
          </button>
        </div>
      ) : (
        <button
          className="button button--primary"
          disabled={pending}
          type="submit"
        >
          {pending
            ? "Salvando…"
            : project
              ? "Salvar alterações"
              : "Criar projeto"}
        </button>
      )}
    </form>
  );
}
