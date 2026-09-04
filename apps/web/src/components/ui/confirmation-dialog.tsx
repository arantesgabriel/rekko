"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ConfirmationDialog({
  cancelLabel = "Cancelar",
  confirmLabel,
  description,
  errorMessage,
  onClose,
  onConfirm,
  open,
  pending = false,
  title,
  tone = "primary",
}: {
  cancelLabel?: string;
  confirmLabel: string;
  description: ReactNode;
  errorMessage?: string;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  pending?: boolean;
  title: string;
  tone?: "danger" | "primary";
}) {
  const panelRef = useRef<HTMLElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const appScroll = document.querySelector<HTMLElement>(".app-shell__scroll");
    const previousOverflow = appScroll?.style.overflow;
    if (appScroll) appScroll.style.overflow = "hidden";
    cancelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!pending) onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable =
        panelRef.current.querySelectorAll<HTMLElement>(focusableSelector);
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (appScroll) appScroll.style.overflow = previousOverflow ?? "";
      previouslyFocused?.focus();
    };
  }, [onClose, open, pending]);

  if (!open) return null;

  const dialog = (
    <div
      className="confirmation-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !pending) {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="confirmation-dialog"
        ref={panelRef}
        role="dialog"
      >
        <header className="confirmation-dialog__header">
          <h2 id={titleId}>{title}</h2>
          <button
            aria-label="Fechar confirmação"
            className="button button--ghost button--icon button--sm"
            disabled={pending}
            onClick={onClose}
            title="Fechar"
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div className="confirmation-dialog__body">
          <div className="confirmation-dialog__description" id={descriptionId}>
            {description}
          </div>
          {errorMessage ? (
            <p className="form-message form-message--error" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </div>
        <footer className="confirmation-dialog__footer">
          <button
            className="button button--secondary"
            disabled={pending}
            onClick={onClose}
            ref={cancelRef}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            aria-busy={pending}
            className={`button button--${tone === "danger" ? "destructive" : "primary"}`}
            disabled={pending}
            onClick={onConfirm}
            type="button"
          >
            {pending ? "Salvando…" : confirmLabel}
          </button>
        </footer>
      </section>
    </div>
  );

  return typeof document === "undefined"
    ? null
    : createPortal(dialog, document.body);
}
