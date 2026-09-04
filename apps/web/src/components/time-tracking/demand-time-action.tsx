"use client";

import { useOptionalActiveSession } from "./active-session-provider";

export function StartTimerButton({
  slug,
  projectId,
  workItemId,
  projectName,
  workItemTitle,
  workItemIdentifier,
  compact = false,
}: {
  slug: string;
  projectId: string;
  workItemId: string;
  projectName: string;
  workItemTitle: string;
  workItemIdentifier?: string | null;
  compact?: boolean;
}) {
  const context = useOptionalActiveSession();
  if (!context) return null;
  const { busy, session, start } = context;
  const activeOnItem = session?.workItemId === workItemId;
  if (activeOnItem) {
    return (
      <span className="timer-working-label">
        <span aria-hidden="true" className="timer-status-dot" />
        {session?.status === "PAUSED" ? "Pausado" : "Em andamento"}
      </span>
    );
  }
  const pending = busy === "starting" || busy === "switching";
  return (
    <button
      aria-label={compact ? "Iniciar atividade" : undefined}
      className={`button button--ghost button--sm start-timer-button start-timer-button--start${compact ? " start-timer-button--compact" : ""}`}
      disabled={pending}
      onClick={() =>
        void start({
          slug,
          projectId,
          workItemId,
          projectName,
          workItemTitle,
          workItemIdentifier,
        })
      }
      title={compact ? "Iniciar atividade" : undefined}
      type="button"
    >
      {pending ? (
        "Aguarde…"
      ) : compact ? (
        <span aria-hidden="true">▶</span>
      ) : (
        <>
          <span aria-hidden="true">▶</span>
          Iniciar
        </>
      )}
    </button>
  );
}
