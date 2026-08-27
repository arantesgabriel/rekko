"use client";

import { useActionState, useEffect, useState } from "react";
import {
  finishTimerAction,
  pauseTimerAction,
  resumeTimerAction,
  startTimerAction,
  switchTimerAction,
  type TimerActionState,
} from "@/modules/time-tracking/actions";
import { formatDuration } from "@/modules/time-tracking/domain";

const initialTimerActionState: TimerActionState = {
  status: "idle",
  message: "",
};

export function TimerDock({
  timer,
  targets,
}: {
  timer: {
    status: "RUNNING" | "PAUSED";
    projectName: string;
    workItemTitle: string | null;
    durationSeconds: number;
    elapsedSeconds: number;
    openSegmentStartedAt: Date | null;
  };
  targets: {
    projects: {
      projectId: string;
      projectName: string;
      slug: string;
      workspaceName: string;
    }[];
    items: {
      projectId: string;
      projectName: string;
      slug: string;
      workspaceName: string;
      workItemId: string;
      workItemTitle: string;
    }[];
  };
}) {
  const [now, setNow] = useState(0);
  const [pauseState, pauseAction, pausePending] = useActionState(
    pauseTimerAction,
    initialTimerActionState,
  );
  const [resumeState, resumeAction, resumePending] = useActionState(
    resumeTimerAction,
    initialTimerActionState,
  );
  const [finishState, finishAction, finishPending] = useActionState(
    finishTimerAction,
    initialTimerActionState,
  );
  useEffect(() => {
    if (timer.status !== "RUNNING") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    const refresh = () => window.location.reload();
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", refresh);
    };
  }, [timer.status]);
  const liveExtra =
    timer.status === "RUNNING" && timer.openSegmentStartedAt
      ? Math.max(
          0,
          Math.floor((now - timer.openSegmentStartedAt.getTime()) / 1000),
        )
      : 0;
  const state =
    pauseState.status === "error"
      ? pauseState
      : resumeState.status === "error"
        ? resumeState
        : finishState;
  return (
    <aside
      className={`timer-dock timer-dock--${timer.status.toLowerCase()}`}
      aria-label="Timer atual"
    >
      <div className="timer-dock__context">
        <span className="timer-status-dot" aria-hidden="true" />
        <div>
          <small>
            {timer.status === "RUNNING" ? "Em andamento" : "Pausado"}
          </small>
          <strong>{timer.workItemTitle ?? timer.projectName}</strong>
          <span>{timer.workItemTitle ? timer.projectName : "Projeto"}</span>
        </div>
      </div>
      <time className="timer-dock__time">
        {formatDuration(
          timer.status === "RUNNING"
            ? timer.durationSeconds + liveExtra
            : timer.elapsedSeconds,
        )}
      </time>
      <div className="timer-dock__actions">
        {timer.status === "RUNNING" ? (
          <form action={pauseAction}>
            <button
              className="button button--secondary"
              disabled={pausePending}
            >
              Pausar
            </button>
          </form>
        ) : (
          <form action={resumeAction}>
            <button className="button button--primary" disabled={resumePending}>
              Retomar
            </button>
          </form>
        )}
        <details className="timer-switcher">
          <summary className="button button--secondary">Trocar</summary>
          <div className="timer-switcher__panel">
            <strong>Trocar atividade</strong>
            {targets.projects.map((target) => (
              <StartTimerButton
                key={`project-${target.projectId}`}
                slug={target.slug}
                projectId={target.projectId}
                workItemId={null}
                activeOnItem={
                  timer.workItemTitle === null &&
                  timer.projectName === target.projectName
                }
                hasActiveTimer
              />
            ))}
            {targets.items.map((target) => (
              <div className="timer-switcher__target" key={target.workItemId}>
                <span>
                  {target.workspaceName} · {target.projectName}
                </span>
                <strong>{target.workItemTitle}</strong>
                <StartTimerButton
                  slug={target.slug}
                  projectId={target.projectId}
                  workItemId={target.workItemId}
                  activeOnItem={
                    timer.workItemTitle === target.workItemTitle &&
                    timer.projectName === target.projectName
                  }
                  hasActiveTimer
                />
              </div>
            ))}
          </div>
        </details>
        <form action={finishAction}>
          <button className="button button--secondary" disabled={finishPending}>
            Encerrar
          </button>
        </form>
      </div>
      {state.status === "error" && <p role="alert">{state.message}</p>}
    </aside>
  );
}

export function StartTimerButton({
  slug,
  projectId,
  workItemId,
  activeOnItem,
  hasActiveTimer,
}: {
  slug: string;
  projectId: string;
  workItemId: string | null;
  activeOnItem: boolean;
  hasActiveTimer: boolean;
}) {
  const action = hasActiveTimer
    ? switchTimerAction.bind(null, slug, projectId, workItemId)
    : startTimerAction.bind(null, slug, projectId, workItemId);
  const [state, formAction, pending] = useActionState(
    action,
    initialTimerActionState,
  );
  if (activeOnItem)
    return (
      <span className="timer-working-label">
        <span className="timer-status-dot" />
        Em andamento
      </span>
    );
  return (
    <div className="start-timer-action">
      <form action={formAction}>
        <button
          className={
            hasActiveTimer
              ? "button button--secondary button--sm"
              : "button button--primary button--sm"
          }
          disabled={pending}
        >
          {pending ? "Aguarde…" : hasActiveTimer ? "Trocar" : "Iniciar"}
        </button>
      </form>
      {state.status === "error" && <small role="alert">{state.message}</small>}
    </div>
  );
}
