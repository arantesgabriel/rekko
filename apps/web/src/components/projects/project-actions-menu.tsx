"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { archiveProjectDrawerAction } from "@/modules/projects/actions";
import type { ProjectListItem } from "@/modules/projects/service";

export function ProjectActionsMenu({
  onEdit,
  onChanged,
  project,
  slug,
}: {
  onChanged?: () => void;
  onEdit: () => void;
  project: Pick<ProjectListItem, "id" | "name">;
  slug: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmationError, setConfirmationError] = useState("");
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
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

  function archive() {
    setConfirmationError("");
    setOpen(false);
    setConfirmOpen(true);
  }

  function confirmArchive() {
    startTransition(() => {
      void archiveProjectDrawerAction(slug, project.id).then((result) => {
        if (result.status === "success") {
          setConfirmOpen(false);
          onChanged?.();
        } else {
          setConfirmationError(result.message);
        }
      });
    });
  }

  return (
    <div className="project-actions-menu" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Mais ações para ${project.name}`}
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
        <div className="project-actions-menu__panel" role="menu">
          <button
            className="project-actions-menu__item"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            role="menuitem"
            type="button"
          >
            Editar projeto
          </button>
          <div className="project-actions-menu__separator" />
          <button
            className="project-actions-menu__item is-danger"
            disabled={pending}
            onClick={archive}
            role="menuitem"
            type="button"
          >
            Arquivar projeto
          </button>
        </div>
      ) : null}
      <ConfirmationDialog
        confirmLabel="Arquivar"
        description={
          <>
            O projeto “{project.name}” e suas demandas deixarão de aparecer nas
            listas.
          </>
        }
        errorMessage={confirmationError}
        onClose={() => {
          if (pending) return;
          setConfirmOpen(false);
          setConfirmationError("");
          triggerRef.current?.focus();
        }}
        onConfirm={confirmArchive}
        open={confirmOpen}
        pending={pending}
        title="Arquivar projeto?"
        tone="danger"
      />
    </div>
  );
}
