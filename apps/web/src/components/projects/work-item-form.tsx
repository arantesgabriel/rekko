"use client";

import { useActionState } from "react";

import {
  createWorkItemAction,
  type ProjectActionState,
  updateWorkItemAction,
} from "@/modules/projects/actions";
import { formatEstimate } from "@/modules/projects/domain";

const initialState: ProjectActionState = { message: "", status: "idle" };

type ItemValues = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  estimatedMinutes: number | null;
  parentWorkItemId: string | null;
};

export function WorkItemForm({
  slug,
  projectId,
  item,
  parents,
}: {
  slug: string;
  projectId: string;
  item?: ItemValues;
  parents: { id: string; title: string }[];
}) {
  const action = item
    ? updateWorkItemAction.bind(null, slug, projectId, item.id)
    : createWorkItemAction.bind(null, slug, projectId);
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <form action={formAction} className="work-form work-form--compact">
      <div className="form-grid">
        <label className="form-control form-control--wide">
          <span>Título *</span>
          <input
            defaultValue={item?.title}
            maxLength={180}
            minLength={2}
            name="title"
            required
          />
        </label>
        <label className="form-control form-control--wide">
          <span>Descrição</span>
          <textarea
            defaultValue={item?.description ?? ""}
            maxLength={4000}
            name="description"
            rows={2}
          />
        </label>
        <label className="form-control">
          <span>Status</span>
          <select defaultValue={item?.status ?? "TODO"} name="status">
            <option value="TODO">A fazer</option>
            <option value="IN_PROGRESS">Em andamento</option>
            <option value="DONE">Concluída</option>
          </select>
        </label>
        <label className="form-control">
          <span>Estimativa</span>
          <input
            defaultValue={
              item?.estimatedMinutes
                ? formatEstimate(item.estimatedMinutes)
                : ""
            }
            name="estimate"
            placeholder="Ex.: 30m ou 1h 30m"
          />
        </label>
        <label className="form-control form-control--wide">
          <span>Demanda principal</span>
          <select
            defaultValue={item?.parentWorkItemId ?? ""}
            name="parentWorkItemId"
          >
            <option value="">Nenhuma — item principal</option>
            {parents
              .filter((parent) => parent.id !== item?.id)
              .map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.title}
                </option>
              ))}
          </select>
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
      <button
        className="button button--primary"
        disabled={pending}
        type="submit"
      >
        {pending ? "Salvando…" : item ? "Salvar demanda" : "Criar demanda"}
      </button>
    </form>
  );
}
