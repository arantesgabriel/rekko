"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { ActionToast } from "@/components/ui/action-toast";
import {
  formatDuration,
  liveElapsedSeconds,
} from "@/modules/time-tracking/domain";

import { sessionDemandLabel } from "./active-session-model";
import { useActiveSession } from "./active-session-provider";
import { SwitchSessionDialog } from "./switch-session-dialog";

function PauseIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <rect fill="currentColor" height="10" rx="1" width="2.4" x="4" y="3" />
      <rect fill="currentColor" height="10" rx="1" width="2.4" x="9.6" y="3" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <path d="M5 3.2v9.6L13 8 5 3.2Z" fill="currentColor" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <rect fill="currentColor" height="8" rx="1.2" width="8" x="4" y="4" />
    </svg>
  );
}

export function ActiveSession() {
  const {
    busy,
    cancelSwitch,
    confirmSwitch,
    error,
    finish,
    pause,
    pendingSwitch,
    resume,
    session,
    start,
    targets,
    timezone,
    toast,
    dismissToast,
  } = useActiveSession();
  const [now, setNow] = useState(() => Date.now());
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [leaving, setLeaving] = useState(false);
  const detailsId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<number>(0);

  function requestFinish() {
    if (leaving || busy !== "idle") return;
    setLeaving(true);
    setPickerOpen(false);
    setDetailsOpen(false);
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => {
      void finish().finally(() => setLeaving(false));
    }, 180);
  }

  useEffect(() => {
    if (!session || session.status !== "RUNNING") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [session]);

  const originalTitle = useRef<string | null>(null);
  useEffect(() => {
    if (!session) {
      if (originalTitle.current) document.title = originalTitle.current;
      return;
    }
    if (!originalTitle.current) originalTitle.current = document.title;
    const elapsed = liveElapsedSeconds({
      status: session.status,
      accumulatedSeconds: session.accumulatedSeconds,
      openSegmentStartedAt: session.openSegmentStartedAt,
      nowMs: now,
    });
    const clock = formatDuration(elapsed).slice(0, 5);
    document.title = `${session.status === "RUNNING" ? "● " : ""}${clock} · Rekko`;
  }, [now, session]);

  useEffect(() => {
    if (!detailsOpen && !pickerOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDetailsOpen(false);
        setPickerOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailsOpen, pickerOpen]);

  useEffect(() => {
    return () => window.clearTimeout(leaveTimer.current);
  }, []);

  const elapsed = session
    ? liveElapsedSeconds({
        status: session.status,
        accumulatedSeconds: session.accumulatedSeconds,
        openSegmentStartedAt: session.openSegmentStartedAt,
        nowMs: now,
      })
    : 0;

  const pickerItems = useMemo(() => {
    const query = pickerQuery.trim().toLowerCase();
    return targets.filter((target) => {
      if (target.workItemId === session?.workItemId) return false;
      if (!query) return true;
      return (
        target.workItemTitle.toLowerCase().includes(query) ||
        target.projectName.toLowerCase().includes(query)
      );
    });
  }, [pickerQuery, session?.workItemId, targets]);

  const startedLabel = session
    ? new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: timezone,
      }).format(new Date(session.startedAt))
    : "";

  if (!session && !toast && !pendingSwitch) return null;

  const running = session?.status === "RUNNING";
  const pending = busy !== "idle" || leaving;

  return (
    <>
      {session ? (
        <aside
          aria-label="Sessão atual"
          className={`active-session active-session--${session.status.toLowerCase()}${detailsOpen ? " is-open" : ""}${leaving ? " is-leaving" : ""}${busy !== "idle" ? ` is-${busy}` : ""}`}
        >
          <button
            aria-controls={detailsId}
            aria-expanded={detailsOpen}
            className="active-session__main"
            onClick={() => setDetailsOpen((open) => !open)}
            type="button"
          >
            <span
              aria-hidden="true"
              className="active-session__indicator"
              key={session.status}
            />
            <span className="sr-only">
              {running ? "Em andamento" : "Pausado"}
            </span>
            <span className="active-session__copy">
              <strong title={sessionDemandLabel(session)}>
                {sessionDemandLabel(session)}
              </strong>
              <small>
                {session.workItemTitle ? session.projectName : "Projeto"}
              </small>
            </span>
            <time className="active-session__clock" dateTime={`PT${elapsed}S`}>
              {formatDuration(elapsed)}
            </time>
          </button>
          <div className="active-session__controls">
            {running ? (
              <button
                aria-label="Pausar"
                className="button button--ghost button--icon active-session__icon"
                disabled={pending}
                onClick={() => void pause()}
                title="Pausar"
                type="button"
              >
                <span className="active-session__glyph">
                  <PauseIcon />
                </span>
              </button>
            ) : (
              <button
                aria-label="Retomar"
                className="button button--primary button--icon active-session__icon"
                disabled={pending}
                onClick={() => void resume()}
                title="Retomar"
                type="button"
              >
                <span className="active-session__glyph">
                  <PlayIcon />
                </span>
              </button>
            )}
            <button
              aria-label={busy === "stopping" ? "Salvando" : "Encerrar"}
              className="button button--ghost button--icon active-session__icon active-session__stop"
              disabled={pending}
              onClick={() => requestFinish()}
              title="Encerrar"
              type="button"
            >
              <span className="active-session__glyph">
                <StopIcon />
              </span>
            </button>
            <button
              aria-expanded={pickerOpen}
              aria-haspopup="dialog"
              aria-label="Mais ações"
              className="button button--ghost button--icon active-session__icon"
              disabled={pending}
              onClick={() => {
                setPickerQuery("");
                setPickerOpen((open) => !open);
                setDetailsOpen(false);
              }}
              title="Mais ações"
              type="button"
            >
              <span aria-hidden="true">···</span>
            </button>
          </div>
          {detailsOpen ? (
            <div
              className="active-session__details"
              id={detailsId}
              ref={panelRef}
            >
              <p>Sessão atual</p>
              <strong>{sessionDemandLabel(session)}</strong>
              <span>
                {session.workItemTitle ? session.projectName : "Projeto"}
              </span>
              <dl>
                <div>
                  <dt>Iniciada às</dt>
                  <dd>{startedLabel}</dd>
                </div>
                <div>
                  <dt>Duração</dt>
                  <dd>{formatDuration(elapsed)}</dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>{running ? "Em andamento" : "Pausada"}</dd>
                </div>
              </dl>
              <button
                className="button button--ghost"
                onClick={() => {
                  setDetailsOpen(false);
                  setPickerOpen(true);
                }}
                type="button"
              >
                Trocar atividade
              </button>
              <button
                className="button button--ghost active-session__finish-text"
                disabled={pending}
                onClick={() => requestFinish()}
                type="button"
              >
                {busy === "stopping" ? "Salvando…" : "Encerrar sessão"}
              </button>
            </div>
          ) : null}
          {pickerOpen ? (
            <div className="active-session__picker" role="dialog">
              <strong>Trocar atividade</strong>
              <label>
                <span className="sr-only">Buscar demanda</span>
                <input
                  autoFocus
                  onChange={(event) => setPickerQuery(event.target.value)}
                  placeholder="Buscar demanda…"
                  type="search"
                  value={pickerQuery}
                />
              </label>
              <ul>
                {pickerItems.length ? (
                  pickerItems.slice(0, 8).map((target) => (
                    <li key={target.workItemId}>
                      <button
                        onClick={() => {
                          setPickerOpen(false);
                          void start({
                            slug: target.slug,
                            projectId: target.projectId,
                            workItemId: target.workItemId,
                            projectName: target.projectName,
                            workItemTitle: target.workItemTitle,
                          });
                        }}
                        type="button"
                      >
                        <strong>{target.workItemTitle}</strong>
                        <span>
                          {target.workspaceName} · {target.projectName}
                        </span>
                      </button>
                    </li>
                  ))
                ) : (
                  <li>
                    <p>Nenhuma demanda encontrada.</p>
                  </li>
                )}
              </ul>
            </div>
          ) : null}
          {error ? (
            <p className="active-session__error" role="alert">
              {error}
            </p>
          ) : null}
        </aside>
      ) : null}
      <SwitchSessionDialog
        current={session}
        elapsedSeconds={elapsed}
        next={pendingSwitch}
        onCancel={cancelSwitch}
        onConfirm={() => void confirmSwitch()}
        open={Boolean(pendingSwitch)}
        pending={busy === "switching"}
      />
      {toast ? <ActionToast message={toast} onDismiss={dismissToast} /> : null}
    </>
  );
}
