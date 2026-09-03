"use client";

import { useActionState } from "react";
import Link from "next/link";

import {
  createGlobalWorkItemAction,
  type ProjectActionState,
} from "@/modules/projects/actions";

const initialState: ProjectActionState = { message: "", status: "idle" };

export function NewDemandForm({
  projects,
  slug,
}: {
  projects: { id: string; name: string }[];
  slug: string;
}) {
  const [state, formAction, pending] = useActionState(
    createGlobalWorkItemAction.bind(null, slug),
    initialState,
  );

  if (projects.length === 0) {
    return (
      <div className="empty-inline new-demand-empty">
        <strong>Crie um projeto primeiro</strong>
        <p>Uma demanda precisa de um contexto para receber seu tempo.</p>
        <Link
          className="button button--primary"
          href={`/w/${slug}/work/new?source=manual`}
        >
          Criar projeto
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="work-form new-demand-form">
      <label className="form-control">
        <span>Projeto *</span>
        <select name="projectId" required>
          <option value="">Selecione um projeto</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      <label className="form-control form-control--wide">
        <span>Título *</span>
        <input maxLength={180} minLength={2} name="title" required />
      </label>
      <label className="form-control form-control--wide">
        <span>Descrição</span>
        <textarea maxLength={4000} name="description" rows={4} />
      </label>
      <div className="form-grid form-grid--compact">
        <label className="form-control">
          <span>Status</span>
          <select defaultValue="TODO" name="status">
            <option value="TODO">A fazer</option>
            <option value="IN_PROGRESS">Em andamento</option>
            <option value="DONE">Concluída</option>
          </select>
        </label>
        <label className="form-control">
          <span>Estimativa</span>
          <input name="estimate" placeholder="Ex.: 30m ou 1h 30m" />
        </label>
      </div>
      <input type="hidden" name="parentWorkItemId" value="" />
      {state.message ? (
        <p
          className={`form-message form-message--${state.status}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
      <div className="new-demand-form__footer">
        <Link className="button button--secondary" href={`/w/${slug}/work`}>
          Cancelar
        </Link>
        <button
          className="button button--primary"
          disabled={pending}
          type="submit"
        >
          {pending ? "Salvando…" : "Criar demanda"}
        </button>
      </div>
    </form>
  );
}
