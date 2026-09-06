"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { formatDuration } from "@/components/projects/project-format";
import {
  saveManualTimeAction,
  type ManualTimeActionState,
} from "@/modules/timeline/actions";
import {
  dateInTimezone,
  intervalSeconds,
  localDateTimeToUtc,
} from "@/modules/timeline/domain";
import type { DemandListItem } from "@/modules/projects/service";
import { manualTimeErrorMessage } from "@/modules/timeline/errors";

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const initialState: ManualTimeActionState = { status: "idle", message: "" };

type DemandContext = Pick<
  DemandListItem,
  "id" | "title" | "externalIdentifier" | "projectId" | "projectName"
>;

export function ManualTimeEntryDialog({
  demand,
  onClose,
  onSaved,
  slug,
  timezone,
}: {
  demand: DemandContext;
  onClose: () => void;
  onSaved: (message: string) => void;
  slug: string;
  timezone: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const [startDate, setStartDate] = useState(() =>
    dateInTimezone(new Date(), timezone),
  );
  const [endDate, setEndDate] = useState(() =>
    dateInTimezone(new Date(), timezone),
  );
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [description, setDescription] = useState("");
  const [clientError, setClientError] = useState("");
  const [state, action, pending] = useActionState(
    saveManualTimeAction.bind(null, slug),
    initialState,
  );

  const preview = previewDuration(
    startDate,
    startTime,
    endDate,
    endTime,
    timezone,
  );
  const demandLabel = demand.externalIdentifier
    ? `${demand.externalIdentifier}: ${demand.title}`
    : demand.title;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!pending) onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable =
        panelRef.current.querySelectorAll<HTMLElement>(focusableSelector);
      if (!focusable.length) return;
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
      previouslyFocused?.focus();
    };
  }, [onClose, pending]);

  useEffect(() => {
    if (state.status === "success") onSaved(state.message);
  }, [onSaved, state]);

  return createPortal(
    <div
      className="time-drawer-backdrop"
      data-overlay-dialog="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <button
        aria-label="Fechar painel"
        disabled={pending}
        onClick={onClose}
        type="button"
      />
      <aside
        aria-labelledby={titleId}
        aria-modal="true"
        className="time-drawer"
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <header>
          <div>
            <p>Adicionar tempo</p>
            <h2 id={titleId}>{demandLabel}</h2>
          </div>
          <button
            aria-label="Fechar"
            className="button button--ghost button--icon"
            disabled={pending}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>
        <form
          action={(formData) => {
            if (!preview) {
              setClientError(manualTimeErrorMessage.INVALID_INTERVAL);
              return;
            }
            setClientError("");
            action(formData);
          }}
          className="time-form"
        >
          <input name="entryId" type="hidden" value="" />
          <input name="date" type="hidden" value={startDate} />
          <input name="projectId" type="hidden" value={demand.projectId} />
          <input name="workItemId" type="hidden" value={demand.id} />
          <div className="manual-time-entry-context">
            <span>Projeto</span>
            <strong>{demand.projectName}</strong>
          </div>
          <div className="form-row">
            <label>
              Data inicial
              <input
                name="startDate"
                onChange={(event) => setStartDate(event.currentTarget.value)}
                required
                type="date"
                value={startDate}
              />
            </label>
            <label>
              Data final
              <input
                name="endDate"
                onChange={(event) => setEndDate(event.currentTarget.value)}
                required
                type="date"
                value={endDate}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Início
              <input
                name="startTime"
                onChange={(event) => setStartTime(event.currentTarget.value)}
                required
                type="time"
                value={startTime}
              />
            </label>
            <label>
              Fim
              <input
                name="endTime"
                onChange={(event) => setEndTime(event.currentTarget.value)}
                required
                type="time"
                value={endTime}
              />
            </label>
          </div>
          <p className="manual-time-entry-duration">
            <span>Duração</span>
            <strong>{preview ?? "—"}</strong>
          </p>
          <label>
            Descrição <span>opcional</span>
            <textarea
              maxLength={2000}
              name="description"
              onChange={(event) => setDescription(event.currentTarget.value)}
              rows={4}
              value={description}
            />
          </label>
          {clientError || state.status === "error" ? (
            <p className="form-message form-message--error" role="alert">
              {clientError || state.message}
            </p>
          ) : null}
          <footer>
            <button
              className="button button--secondary"
              disabled={pending}
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="button button--primary"
              disabled={pending}
              type="submit"
            >
              {pending ? "Salvando…" : "Salvar tempo"}
            </button>
          </footer>
        </form>
      </aside>
    </div>,
    document.body,
  );
}

function previewDuration(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
  timezone: string,
) {
  if (!startDate || !startTime || !endDate || !endTime) return null;
  try {
    const start = localDateTimeToUtc(startDate, startTime, timezone);
    const end = localDateTimeToUtc(endDate, endTime, timezone);
    if (!(start < end)) return null;
    return formatDuration(intervalSeconds({ start, end }));
  } catch {
    return null;
  }
}
