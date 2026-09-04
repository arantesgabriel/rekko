"use client";

import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { createPortal } from "react-dom";

import { formatDuration } from "@/components/projects/project-format";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type {
  DemandListItem,
  DemandTimeRecord,
} from "@/modules/projects/service";
import {
  deleteOwnTimeEntryAction,
  updateOwnTimeEntryAction,
  type ManualTimeActionState,
} from "@/modules/timeline/actions";
import {
  clockTimeInTimezone,
  dateInTimezone,
  intervalSeconds,
  localDateTimeToUtc,
} from "@/modules/timeline/domain";
import { manualTimeErrorMessage } from "@/modules/timeline/errors";

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const initialState: ManualTimeActionState = { status: "idle", message: "" };

function formatRecordDate(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: timezone,
  })
    .format(date)
    .replace(" de ", " ");
}

function formatRecordTime(date: Date, timezone: string) {
  return clockTimeInTimezone(date, timezone);
}

function sameCalendarDay(start: Date, end: Date, timezone: string) {
  return dateInTimezone(start, timezone) === dateInTimezone(end, timezone);
}

function recordRangeLabel(record: DemandTimeRecord, timezone: string) {
  if (!record.endedAt) {
    return `${formatRecordTime(record.startedAt, timezone)} → agora`;
  }
  const startTime = formatRecordTime(record.startedAt, timezone);
  const endTime = formatRecordTime(record.endedAt, timezone);
  if (sameCalendarDay(record.startedAt, record.endedAt, timezone)) {
    return `${startTime} → ${endTime}`;
  }
  return `${startTime} → ${formatRecordDate(record.endedAt, timezone)} ${endTime}`;
}

function recordDurationLabel(record: DemandTimeRecord) {
  if (!record.endedAt) return "Em andamento";
  if (record.durationSeconds <= 0) return "—";
  return formatDuration(record.durationSeconds);
}

export function DemandTimeRecords({
  demand,
  onChanged,
  onFeedback,
  slug,
  timezone,
}: {
  demand: DemandListItem;
  onChanged?: () => void;
  onFeedback?: (message: string) => void;
  slug: string;
  timezone: string;
}) {
  const visibleRecords = demand.recentRecords;
  return (
    <section
      aria-labelledby="demand-records-title"
      className="demand-drawer__section"
    >
      <h3 id="demand-records-title">Registros recentes</h3>
      {visibleRecords.length ? (
        <ol className="demand-records">
          {visibleRecords.map((record) => (
            <DemandTimeRecordRow
              demand={demand}
              key={record.id}
              record={record}
              slug={slug}
              timezone={timezone}
              {...(onChanged ? { onChanged } : {})}
              {...(onFeedback ? { onFeedback } : {})}
            />
          ))}
        </ol>
      ) : (
        <p className="drawer-empty-copy">
          Ainda não há tempo registrado nesta demanda.
        </p>
      )}
    </section>
  );
}

function DemandTimeRecordRow({
  demand,
  onChanged,
  onFeedback,
  record,
  slug,
  timezone,
}: {
  demand: DemandListItem;
  onChanged?: () => void;
  onFeedback?: (message: string) => void;
  record: DemandTimeRecord;
  slug: string;
  timezone: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const rootRef = useRef<HTMLLIElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const canManageRecord =
    record.status === "COMPLETED" && Boolean(record.endedAt);
  const duration = recordDurationLabel(record);
  const range = recordRangeLabel(record, timezone);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Element | null;
      if (!rootRef.current?.contains(target)) setMenuOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <li className="demand-record" ref={rootRef}>
      <span className="demand-record__date">
        {formatRecordDate(record.startedAt, timezone)}
      </span>
      <span className="demand-record__range" title={range}>
        {range}
      </span>
      <time className="demand-record__duration">{duration}</time>
      {canManageRecord ? (
        <div className="demand-record__actions">
          <button
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={`Ações do registro de ${formatRecordDate(record.startedAt, timezone)}, ${range}`}
            className="demand-record__menu-trigger"
            onClick={() => setMenuOpen((value) => !value)}
            ref={triggerRef}
            title="Mais ações"
            type="button"
          >
            <span aria-hidden="true">···</span>
          </button>
          {menuOpen ? (
            <div className="demand-record__menu" role="menu">
              <button
                className="demand-record__menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  setDialog("edit");
                }}
                role="menuitem"
                type="button"
              >
                Editar registro
              </button>
              <button
                className="demand-record__menu-item is-danger"
                onClick={() => {
                  setMenuOpen(false);
                  setDialog("delete");
                }}
                role="menuitem"
                type="button"
              >
                Excluir registro
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <span className="demand-record__actions" />
      )}
      {dialog === "edit" ? (
        <EditTimeEntryDialog
          demand={demand}
          onClose={() => {
            setDialog(null);
            triggerRef.current?.focus();
          }}
          onSaved={(message) => {
            setDialog(null);
            triggerRef.current?.focus();
            onChanged?.();
            onFeedback?.(message);
          }}
          record={record}
          slug={slug}
          timezone={timezone}
        />
      ) : null}
      <DeleteTimeEntryDialog
        onClose={() => {
          setDialog(null);
          triggerRef.current?.focus();
        }}
        open={dialog === "delete"}
        record={record}
        slug={slug}
        timezone={timezone}
        {...(onChanged ? { onChanged } : {})}
        {...(onFeedback ? { onFeedback } : {})}
      />
    </li>
  );
}

function DeleteTimeEntryDialog({
  onChanged,
  onClose,
  onFeedback,
  open,
  record,
  slug,
  timezone,
}: {
  onChanged?: () => void;
  onClose: () => void;
  onFeedback?: (message: string) => void;
  open: boolean;
  record: DemandTimeRecord;
  slug: string;
  timezone: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  if (!record.endedAt) return null;
  return (
    <ConfirmationDialog
      confirmLabel="Excluir registro"
      description={
        <>
          <p className="demand-record-preview">
            <strong>{formatRecordDate(record.startedAt, timezone)}</strong>
            <span>{recordRangeLabel(record, timezone)}</span>
            <span>{recordDurationLabel(record)}</span>
          </p>
          <p>
            Este registro será removido do tempo da demanda e dos totais
            relacionados.
          </p>
        </>
      }
      errorMessage={error}
      onClose={onClose}
      onConfirm={() => {
        setError("");
        startTransition(() => {
          void deleteOwnTimeEntryAction(slug, record.id).then((result) => {
            if (result.status === "success") {
              onClose();
              onChanged?.();
              onFeedback?.(result.message);
              return;
            }
            setError(result.message);
          });
        });
      }}
      open={open}
      pending={pending}
      pendingLabel="Excluindo…"
      title="Excluir registro?"
      tone="danger"
    />
  );
}

function EditTimeEntryDialog({
  demand,
  onClose,
  onSaved,
  record,
  slug,
  timezone,
}: {
  demand: DemandListItem;
  onClose: () => void;
  onSaved: (message: string) => void;
  record: DemandTimeRecord;
  slug: string;
  timezone: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [startDate, setStartDate] = useState(
    dateInTimezone(record.startedAt, timezone),
  );
  const [startTime, setStartTime] = useState(
    clockTimeInTimezone(record.startedAt, timezone),
  );
  const [endDate, setEndDate] = useState(
    record.endedAt
      ? dateInTimezone(record.endedAt, timezone)
      : dateInTimezone(record.startedAt, timezone),
  );
  const [endTime, setEndTime] = useState(
    record.endedAt ? clockTimeInTimezone(record.endedAt, timezone) : "",
  );
  const [clientError, setClientError] = useState("");
  const [state, action, pending] = useActionState(
    updateOwnTimeEntryAction.bind(null, slug, record.id),
    initialState,
  );

  const preview = previewDuration(
    startDate,
    startTime,
    endDate,
    endTime,
    timezone,
  );

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

  const demandLabel = demand.externalIdentifier
    ? `${demand.externalIdentifier}: ${demand.title}`
    : demand.title;

  return createPortal(
    <div
      className="settings-dialog-backdrop"
      data-overlay-dialog="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="settings-dialog demand-time-edit-dialog"
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <form
          action={(formData) => {
            const next = previewDuration(
              startDate,
              startTime,
              endDate,
              endTime,
              timezone,
            );
            if (!next) {
              setClientError(manualTimeErrorMessage.INVALID_INTERVAL);
              return;
            }
            setClientError("");
            action(formData);
          }}
          className="settings-form"
        >
          <div>
            <h2 id={titleId}>Editar registro</h2>
          </div>
          <p className="demand-time-edit-dialog__meta">
            <span>Demanda</span>
            <strong>{demandLabel}</strong>
          </p>
          <p className="demand-time-edit-dialog__meta">
            <span>Projeto</span>
            <strong>{demand.projectName}</strong>
          </p>
          <label>
            <span>Início</span>
            <div className="demand-time-edit-dialog__pair">
              <input
                name="startDate"
                onChange={(event) => setStartDate(event.currentTarget.value)}
                required
                type="date"
                value={startDate}
              />
              <input
                aria-label="Horário inicial"
                name="startTime"
                onChange={(event) => setStartTime(event.currentTarget.value)}
                required
                type="time"
                value={startTime}
              />
            </div>
          </label>
          <label>
            <span>Fim</span>
            <div className="demand-time-edit-dialog__pair">
              <input
                name="endDate"
                onChange={(event) => setEndDate(event.currentTarget.value)}
                required
                type="date"
                value={endDate}
              />
              <input
                aria-label="Horário final"
                name="endTime"
                onChange={(event) => setEndTime(event.currentTarget.value)}
                required
                type="time"
                value={endTime}
              />
            </div>
          </label>
          <p className="demand-time-edit-dialog__duration">
            <span>Duração</span>
            <strong>{preview ?? "—"}</strong>
          </p>
          {clientError || state.status === "error" ? (
            <p
              aria-live="polite"
              className="settings-feedback is-error"
              role="alert"
            >
              {clientError || state.message}
            </p>
          ) : null}
          <div className="settings-dialog__actions">
            <button
              className="button button--ghost"
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
              {pending ? "Salvando…" : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
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
