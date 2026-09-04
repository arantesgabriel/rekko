"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  createDemandDrawerAction,
  createGlobalWorkItemAction,
  type ProjectActionState,
  updateWorkItemAction,
} from "@/modules/projects/actions";
import { formatEstimate } from "@/modules/projects/domain";
import type { DemandListItem } from "@/modules/projects/service";

const initialState: ProjectActionState = { message: "", status: "idle" };

type DemandValues = Pick<
  DemandListItem,
  | "id"
  | "title"
  | "description"
  | "status"
  | "estimatedMinutes"
  | "projectId"
  | "projectName"
  | "parentWorkItemId"
>;

export function DemandForm({
  drawer = false,
  item,
  onCancel,
  onDirtyChange,
  onSuccess,
  parents = [],
  projectId,
  projects,
  slug,
}: {
  drawer?: boolean;
  item?: DemandValues;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onSuccess?: () => void;
  parents?: { id: string; title: string }[];
  projectId?: string;
  projects: { id: string; name: string }[];
  slug: string;
}) {
  const router = useRouter();
  const selectedProjectId = projectId ?? item?.projectId;
  const action = item
    ? updateWorkItemAction.bind(null, slug, item.projectId, item.id)
    : drawer
      ? createDemandDrawerAction.bind(null, slug)
      : createGlobalWorkItemAction.bind(null, slug);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.status !== "success") return;
    router.refresh();
    onSuccess?.();
  }, [onSuccess, router, state.status]);

  if (!projects.length && !selectedProjectId) {
    return (
      <div className="empty-inline new-demand-empty">
        <strong>Nenhum projeto encontrado</strong>
        <p>Uma demanda precisa de um projeto para receber seu tempo.</p>
        <Link className="button button--secondary" href={`/w/${slug}/projects`}>
          Ir para Projetos
        </Link>
      </div>
    );
  }

  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId,
  );
  return (
    <form
      action={formAction}
      className={`work-form demand-form${drawer ? " drawer-form" : ""}`}
      onChange={drawer ? () => onDirtyChange?.(true) : undefined}
    >
      <label className="form-control form-control--wide">
        <span>Título *</span>
        <input
          autoFocus={drawer && !item}
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
          rows={4}
        />
      </label>
      <div className="form-grid form-grid--compact">
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
      </div>
      {selectedProjectId ? (
        <>
          <div className="form-control form-control--wide">
            <span>Projeto</span>
            <div className="drawer-readonly-field">
              <strong>{selectedProject?.name ?? item?.projectName}</strong>
              {projectId ? <small>Definido pelo projeto atual</small> : null}
            </div>
          </div>
          <input name="projectId" type="hidden" value={selectedProjectId} />
        </>
      ) : (
        <label className="form-control form-control--wide">
          <span>Projeto *</span>
          <select
            defaultValue={item?.projectId ?? ""}
            name="projectId"
            required
          >
            <option value="">Selecionar projeto…</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {parents.length ? (
        <label className="form-control form-control--wide">
          <span>Demanda principal</span>
          <select
            defaultValue={item?.parentWorkItemId ?? ""}
            name="parentWorkItemId"
          >
            <option value="">Nenhuma — demanda principal</option>
            {parents
              .filter((parent) => parent.id !== item?.id)
              .map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.title}
                </option>
              ))}
          </select>
        </label>
      ) : (
        <input name="parentWorkItemId" type="hidden" value="" />
      )}
      {state.message ? (
        <p
          className={`form-message form-message--${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
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
              : item
                ? "Salvar alterações"
                : "Criar demanda"}
          </button>
        </div>
      ) : (
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
      )}
    </form>
  );
}

export function NewDemandForm({
  projects,
  slug,
}: {
  projects: { id: string; name: string }[];
  slug: string;
}) {
  return <DemandForm projects={projects} slug={slug} />;
}
