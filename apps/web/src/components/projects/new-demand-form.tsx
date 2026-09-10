"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
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
  initialParentId,
  projectId,
  projects,
  slug,
}: {
  drawer?: boolean;
  item?: DemandValues;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onSuccess?: (createdDemandId?: string) => void;
  parents?: {
    id: string;
    title: string;
    projectId?: string;
    workItemBreadcrumb?: string | null | undefined;
  }[];
  initialParentId?: string;
  projectId?: string;
  projects: { id: string; name: string }[];
  slug: string;
}) {
  const router = useRouter();
  const fixedProjectId = projectId ?? item?.projectId;
  const [selectedProjectId, setSelectedProjectId] = useState(
    fixedProjectId ?? "",
  );
  const [selectedParentId, setSelectedParentId] = useState(
    initialParentId ?? item?.parentWorkItemId ?? "",
  );
  const [parentMode, setParentMode] = useState<"NONE" | "EXISTING" | "NEW">(
    initialParentId || item?.parentWorkItemId ? "EXISTING" : "NONE",
  );
  const action = item
    ? updateWorkItemAction.bind(null, slug, item.projectId, item.id)
    : drawer
      ? createDemandDrawerAction.bind(null, slug)
      : createGlobalWorkItemAction.bind(null, slug);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.status !== "success") return;
    router.refresh();
    onSuccess?.(state.createdDemandId);
  }, [onSuccess, router, state.createdDemandId, state.status]);

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
      onChange={(event) => {
        if (drawer) onDirtyChange?.(true);
        if (
          !fixedProjectId &&
          event.target instanceof HTMLSelectElement &&
          event.target.name === "projectId"
        ) {
          setSelectedProjectId(event.target.value);
          setSelectedParentId("");
          setParentMode("NONE");
        }
      }}
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
      <input name="parentMode" type="hidden" value={parentMode} />
      {parentMode === "NEW" ? (
        <fieldset className="demand-form__new-parent">
          <input name="parentWorkItemId" type="hidden" value="" />
          <legend>Criar demanda pai</legend>
          <p className="demand-form__hint">
            A demanda atual será criada como filha desta nova demanda.
          </p>
          <label className="form-control form-control--wide">
            <span>Título da demanda pai *</span>
            <input
              autoFocus={!drawer}
              maxLength={180}
              minLength={2}
              name="parentTitle"
              required
            />
          </label>
          <label className="form-control form-control--wide">
            <span>Descrição da demanda pai</span>
            <textarea maxLength={4000} name="parentDescription" rows={3} />
          </label>
          <div className="form-grid form-grid--compact">
            <label className="form-control">
              <span>Status da demanda pai</span>
              <select defaultValue="TODO" name="parentStatus">
                <option value="TODO">A fazer</option>
                <option value="IN_PROGRESS">Em andamento</option>
                <option value="DONE">Concluída</option>
              </select>
            </label>
            <label className="form-control">
              <span>Estimativa da demanda pai</span>
              <input name="parentEstimate" placeholder="Ex.: 1h ou 2h 30m" />
            </label>
          </div>
          {parents.some((parent) => parent.projectId === selectedProjectId) ? (
            <label className="form-control form-control--wide">
              <span>Demanda pai desta nova demanda pai (opcional)</span>
              <select name="parentParentWorkItemId">
                <option value="">Nenhuma — ficará no nível principal</option>
                {parents
                  .filter((parent) => parent.projectId === selectedProjectId)
                  .map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.workItemBreadcrumb ?? parent.title}
                    </option>
                  ))}
              </select>
            </label>
          ) : (
            <input name="parentParentWorkItemId" type="hidden" value="" />
          )}
          <button
            className="button button--ghost button--sm"
            onClick={() => setParentMode("NONE")}
            type="button"
          >
            Remover demanda pai nova
          </button>
        </fieldset>
      ) : (
        <>
          {initialParentId ? (
            <>
              <div className="form-control form-control--wide">
                <span>Demanda principal</span>
                <div className="drawer-readonly-field">
                  <strong>
                    {parents.find((parent) => parent.id === initialParentId)
                      ?.workItemBreadcrumb ??
                      parents.find((parent) => parent.id === initialParentId)
                        ?.title ??
                      "Demanda atual"}
                  </strong>
                  <small>A demanda atual será criada como filha</small>
                </div>
              </div>
              <input
                name="parentWorkItemId"
                type="hidden"
                value={initialParentId}
              />
            </>
          ) : parents.some(
              (parent) => parent.projectId === selectedProjectId,
            ) ? (
            <label className="form-control form-control--wide">
              <span>Demanda principal</span>
              <select
                onChange={(event) => {
                  setSelectedParentId(event.target.value);
                  setParentMode(event.target.value ? "EXISTING" : "NONE");
                }}
                name="parentWorkItemId"
                value={selectedParentId}
              >
                <option value="">Nenhuma — demanda principal</option>
                {parents
                  .filter(
                    (parent) =>
                      parent.projectId === selectedProjectId &&
                      parent.id !== item?.id,
                  )
                  .map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.workItemBreadcrumb ?? parent.title}
                    </option>
                  ))}
              </select>
            </label>
          ) : (
            <input name="parentWorkItemId" type="hidden" value="" />
          )}
          {!item && !initialParentId ? (
            <button
              className="button button--secondary demand-form__new-parent-trigger"
              onClick={() => setParentMode("NEW")}
              type="button"
            >
              + Criar demanda pai nesta tela
            </button>
          ) : null}
        </>
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
            onClick={() => (onCancel ?? onSuccess)?.()}
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
  parents = [],
  projects,
  slug,
}: {
  parents?: {
    id: string;
    title: string;
    projectId?: string;
    workItemBreadcrumb?: string | null | undefined;
  }[];
  projects: { id: string; name: string }[];
  slug: string;
}) {
  return <DemandForm parents={parents} projects={projects} slug={slug} />;
}
