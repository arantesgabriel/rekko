"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Drawer({
  children,
  eyebrow,
  footer,
  headerActions,
  onClose,
  open,
  title,
}: {
  children: ReactNode;
  eyebrow?: ReactNode;
  footer?: ReactNode;
  headerActions?: ReactNode;
  onClose: () => void;
  open: boolean;
  title: ReactNode;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const appScroll = document.querySelector<HTMLElement>(".app-shell__scroll");
    const previousOverflow = appScroll?.style.overflow;
    if (appScroll) appScroll.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
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
  }, [onClose, open]);

  if (!open) return null;
  return (
    <div
      className="drawer-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        aria-labelledby={titleId}
        aria-modal="true"
        className="drawer"
        ref={panelRef}
        role="dialog"
      >
        <header className="drawer__header">
          <div className="drawer__heading">
            {eyebrow ? (
              <span className="drawer__eyebrow">{eyebrow}</span>
            ) : null}
            <h2 id={titleId}>{title}</h2>
          </div>
          <div className="drawer__header-actions">
            {headerActions}
            <button
              aria-label="Fechar painel"
              className="button button--ghost button--icon button--sm"
              onClick={onClose}
              ref={closeRef}
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </header>
        <div className="drawer__body">{children}</div>
        {footer ? <footer className="drawer__footer">{footer}</footer> : null}
      </aside>
    </div>
  );
}
