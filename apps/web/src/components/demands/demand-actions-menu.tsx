"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  archiveWorkItemAction,
  duplicateWorkItemAction,
  moveWorkItemAction,
  setWorkItemStatusAction,
} from "@/modules/projects/actions";
import type {
  DemandListItem,
  DemandProjectOption,
} from "@/modules/projects/service";

export function DemandActionsMenu({
  canManage,
  demand,
  onEdit,
  onChanged,
  onFeedback,
  projects,
  slug,
}: {
  canManage: boolean;
  demand: DemandListItem;
  onChanged?: () => void;
  onEdit?: () => void;
  onFeedback?: (message: string) => void;
  projects: DemandProjectOption[];
  slug: string;
}) {
  const [open, setOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [confirmAction, setConfirmAction] = useState<
    "archive" | "complete" | null
  >(null);
  const [confirmationError, setConfirmationError] = useState("");
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Element | null;
      if (
        !rootRef.current?.contains(target) &&
        !target?.closest(".confirmation-dialog-backdrop")
      )
        setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!canManage) return null;
  const readOnly = demand.source === "LINEAR";
  const run = (
    operation: () => Promise<{ status: string; message: string }>,
  ) => {
    setFeedback("");
    startTransition(() => {
      void operation().then((result) => {
        if (result.status === "success") {
          setOpen(false);
          setConfirmAction(null);
          setConfirmationError("");
          onChanged?.();
          onFeedback?.(result.message);
        } else if (confirmAction) {
          setConfirmationError(result.message);
        } else {
          setFeedback(result.message);
        }
      });
    });
  };
  const changeStatus = () => {
    if (demand.status === "DONE") {
      run(() => setWorkItemStatusAction(slug, demand.id, "TODO"));
      return;
    }
    setConfirmationError("");
    setConfirmAction("complete");
  };

  const archive = () => {
    setConfirmationError("");
    setConfirmAction("archive");
  };

  return (
    <div className="demand-actions-menu" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Mais ações para ${demand.externalIdentifier ?? demand.title}`}
        className="button button--ghost button--icon button--sm"
        disabled={pending}
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        title="Mais ações"
        type="button"
      >
        <span aria-hidden="true">•••</span>
      </button>
      {open ? (
        <div className="demand-actions-menu__panel" role="menu">
          <button
            className="demand-actions-menu__item"
            disabled={readOnly || pending}
            onClick={() => {
              setOpen(false);
              onEdit?.();
            }}
            role="menuitem"
            title={readOnly ? "Atualizada pelo Linear" : undefined}
            type="button"
          >
            Editar demanda
          </button>
          <button
            className="demand-actions-menu__item"
            disabled={readOnly || pending}
            onClick={changeStatus}
            role="menuitem"
            title={readOnly ? "Atualizada pelo Linear" : undefined}
            type="button"
          >
            {demand.status === "DONE" ? "Reabrir demanda" : "Concluir demanda"}
          </button>
          <div className="demand-actions-menu__separator" />
          <button
            className="demand-actions-menu__item"
            disabled={readOnly || pending}
            onClick={() => setMoving((value) => !value)}
            role="menuitem"
            title={readOnly ? "Atualizada pelo Linear" : undefined}
            type="button"
          >
            Mover para projeto
            <span aria-hidden="true">›</span>
          </button>
          {moving ? (
            <div className="demand-actions-menu__move-list">
              {projects
                .filter((project) => project.id !== demand.projectId)
                .map((project) => (
                  <button
                    className="demand-actions-menu__item"
                    disabled={pending}
                    key={project.id}
                    onClick={() =>
                      run(() => moveWorkItemAction(slug, demand.id, project.id))
                    }
                    role="menuitem"
                    type="button"
                  >
                    {project.name}
                  </button>
                ))}
              {!projects.some((project) => project.id !== demand.projectId) ? (
                <span className="demand-actions-menu__empty">
                  Nenhum outro projeto
                </span>
              ) : null}
            </div>
          ) : null}
          <button
            className="demand-actions-menu__item"
            disabled={readOnly || pending}
            onClick={() => run(() => duplicateWorkItemAction(slug, demand.id))}
            role="menuitem"
            title={readOnly ? "Atualizada pelo Linear" : undefined}
            type="button"
          >
            Duplicar
          </button>
          <div className="demand-actions-menu__separator" />
          <button
            className="demand-actions-menu__item is-danger"
            disabled={readOnly || pending}
            onClick={() => {
              archive();
            }}
            role="menuitem"
            title={readOnly ? "Atualizada pelo Linear" : undefined}
            type="button"
          >
            Arquivar
          </button>
          {demand.externalUrl ? (
            <a
              className="demand-actions-menu__item"
              href={demand.externalUrl}
              rel="noreferrer"
              role="menuitem"
              target="_blank"
            >
              Abrir no Linear
            </a>
          ) : null}
          {feedback && pending === false ? (
            <span className="demand-actions-menu__feedback" role="status">
              {feedback}
            </span>
          ) : null}
        </div>
      ) : null}
      <ConfirmationDialog
        confirmLabel={confirmAction === "archive" ? "Arquivar" : "Concluir"}
        description={
          confirmAction === "archive" ? (
            <>A demanda “{demand.title}” deixará de aparecer nas listas.</>
          ) : (
            <>
              A demanda “{demand.title}” será marcada como concluída. Você
              poderá reabri-la posteriormente.
            </>
          )
        }
        errorMessage={confirmationError}
        onClose={() => {
          if (pending) return;
          setConfirmAction(null);
          setConfirmationError("");
          triggerRef.current?.focus();
        }}
        onConfirm={() => {
          if (confirmAction === "archive") {
            run(() => archiveWorkItemAction(slug, demand.id));
          } else {
            run(() => setWorkItemStatusAction(slug, demand.id, "DONE"));
          }
        }}
        open={confirmAction !== null}
        pending={pending}
        title={
          confirmAction === "archive"
            ? "Arquivar demanda?"
            : "Concluir demanda?"
        }
        tone={confirmAction === "archive" ? "danger" : "primary"}
      />
    </div>
  );
}
