"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [now, setNow] = useState(0);
  const [pauseState, pauseAction, pausePending] = useActionState(
    async (previous: TimerActionState, formData: FormData) => {
      void formData;
      const next = await pauseTimerAction(previous);
      if (next.status === "success") router.refresh();
      return next;
    },
    initialTimerActionState,
  );
  const [resumeState, resumeAction, resumePending] = useActionState(
    async (previous: TimerActionState, formData: FormData) => {
      void formData;
      const next = await resumeTimerAction(previous);
      if (next.status === "success") router.refresh();
      return next;
    },
    initialTimerActionState,
  );
  const [finishState, finishAction, finishPending] = useActionState(
    async (previous: TimerActionState, formData: FormData) => {
      void formData;
      const next = await finishTimerAction(previous);
      if (next.status === "success") router.refresh();
      return next;
    },
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
      <div className="timer-dock__actions timer-dock__actions--desktop">
        {timer.status === "RUNNING" ? (
          <form action={pauseAction}>
            <button
              className="button button--secondary"
              disabled={pausePending}
              type="submit"
            >
              Pausar
            </button>
          </form>
        ) : (
          <form action={resumeAction}>
            <button
              className="button button--primary"
              disabled={resumePending}
              type="submit"
            >
              Retomar
            </button>
          </form>
        )}
        <details className="timer-switcher">
          <summary className="button button--secondary">Trocar</summary>
          <div className="timer-switcher__panel">
            <strong>Trocar atividade</strong>
            <TimerTargets targets={targets} timer={timer} />
          </div>
        </details>
        <form action={finishAction}>
          <button
            className="button button--secondary"
            disabled={finishPending}
            type="submit"
          >
            Encerrar
          </button>
        </form>
      </div>
      <div className="timer-dock__actions timer-dock__actions--mobile">
        {timer.status === "RUNNING" ? (
          <form action={pauseAction}>
            <button
              aria-label="Pausar"
              className="button button--secondary button--icon"
              disabled={pausePending}
              type="submit"
            >
              <span aria-hidden="true">Ⅱ</span>
            </button>
          </form>
        ) : (
          <form action={resumeAction}>
            <button
              aria-label="Retomar"
              className="button button--primary button--icon"
              disabled={resumePending}
              type="submit"
            >
              <span aria-hidden="true">▶</span>
            </button>
          </form>
        )}
        <details className="timer-switcher timer-switcher--mobile">
          <summary
            aria-label="Mais ações do timer"
            className="button button--secondary button--icon"
          >
            <span aria-hidden="true">•••</span>
          </summary>
          <div className="timer-switcher__panel">
            <strong>Trocar atividade</strong>
            <TimerTargets targets={targets} timer={timer} />
            <form action={finishAction}>
              <button
                className="button button--secondary"
                disabled={finishPending}
                type="submit"
              >
                Encerrar timer
              </button>
            </form>
          </div>
        </details>
      </div>
      {state.status === "error" && <p role="alert">{state.message}</p>}
    </aside>
  );
}

function TimerTargets({
  targets,
  timer,
}: {
  targets: {
    items: {
      projectId: string;
      projectName: string;
      slug: string;
      workspaceName: string;
      workItemId: string;
      workItemTitle: string;
    }[];
  };
  timer: {
    projectName: string;
    workItemTitle: string | null;
  };
}) {
  return (
    <>
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
    </>
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
  workItemId: string;
  activeOnItem: boolean;
  hasActiveTimer: boolean;
}) {
  const router = useRouter();
  const action = hasActiveTimer
    ? switchTimerAction.bind(null, slug, projectId, workItemId)
    : startTimerAction.bind(null, slug, projectId, workItemId);
  const [state, formAction, pending] = useActionState(
    async (previous: TimerActionState, formData: FormData) => {
      void formData;
      const next = await action(previous);
      if (next.status === "success") router.refresh();
      return next;
    },
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
          type="submit"
        >
          {pending ? "Aguarde…" : hasActiveTimer ? "Trocar" : "Iniciar"}
        </button>
      </form>
      {state.status === "error" && <small role="alert">{state.message}</small>}
    </div>
  );
}
