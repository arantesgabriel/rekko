"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  AdminTimeActionState,
  archiveTimeEntryAction,
  correctTimeEntryAction,
} from "@/modules/time-tracking/actions";
import {
  formatReportInputDate,
  formatReportInputTime,
} from "@/modules/reports/domain";
import type { ReportFilterOptions, ReportRow } from "@/modules/reports/service";

const initialState: AdminTimeActionState = { status: "idle", message: "" };

export function TimeEntryActions({
  projects,
  row,
  currentUserId,
  timezone,
  workItems,
  workspaceSlug,
}: {
  projects: ReportFilterOptions["projects"];
  row: ReportRow;
  currentUserId: string;
  timezone: string;
  workItems: ReportFilterOptions["workItems"];
  workspaceSlug: string;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"correct" | "archive" | null>(null);
  const [projectId, setProjectId] = useState(row.projectId);
  const [workItemId, setWorkItemId] = useState(row.workItemId ?? "");
  const dialogRef = useRef<HTMLDivElement>(null);
  const [correctState, correctAction, correctPending] = useActionState(
    correctTimeEntryAction.bind(null, workspaceSlug, row.entryId),
    initialState,
  );
  const [archiveState, archiveAction, archivePending] = useActionState(
    archiveTimeEntryAction.bind(null, workspaceSlug, row.entryId),
    initialState,
  );

  useEffect(() => {
    if (!dialog) return;
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDialog(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialog]);

  useEffect(() => {
    if (
      correctState.status === "success" ||
      archiveState.status === "success"
    ) {
      router.refresh();
      const closeTimer = window.setTimeout(() => setDialog(null), 0);
      return () => window.clearTimeout(closeTimer);
    }
  }, [archiveState.status, correctState.status, router]);

  if (row.entryStatus !== "COMPLETED" || !row.entryFinishedAt) return null;

  const visibleWorkItems = workItems.filter(
    (item) => item.projectId === projectId,
  );
  const openCorrection = () => {
    setProjectId(row.projectId);
    setWorkItemId(row.workItemId ?? "");
    setDialog("correct");
  };

  return (
    <>
      <div className="time-entry-actions">
        <div className="time-entry-actions__desktop">
          {row.userId !== currentUserId ? (
            <button
              className="button button--ghost"
              onClick={openCorrection}
              type="button"
            >
              Corrigir
            </button>
          ) : null}
          <button
            className="button button--ghost"
            onClick={() => setDialog("archive")}
            type="button"
          >
            Arquivar
          </button>
        </div>
        <details className="time-entry-actions__mobile">
          <summary
            aria-label="Mais ações do segmento"
            className="button button--ghost button--icon button--sm"
          >
            <span aria-hidden="true">•••</span>
          </summary>
          <div className="time-entry-actions__menu">
            {row.userId !== currentUserId ? (
              <button
                className="button button--ghost"
                onClick={openCorrection}
                type="button"
              >
                Corrigir
              </button>
            ) : null}
            <button
              className="button button--ghost"
              onClick={() => setDialog("archive")}
              type="button"
            >
              Arquivar
            </button>
          </div>
        </details>
      </div>
      {dialog ? (
        <div className="settings-dialog-backdrop">
          <div
            aria-labelledby={`${row.entryId}-${dialog}-title`}
            aria-modal="true"
            className="settings-dialog"
            ref={dialogRef}
            role="dialog"
            tabIndex={-1}
          >
            {dialog === "correct" ? (
              <form action={correctAction} className="settings-form">
                <div>
                  <span className="eyebrow">Correção de tempo</span>
                  <h2 id={`${row.entryId}-correct-title`}>Corrigir registro</h2>
                  <p className="settings-dialog__description">
                    A correção atualiza o registro inteiro. Pausas e segmentos
                    múltiplos precisam ser preservados.
                  </p>
                </div>
                <div className="settings-grid settings-grid--two">
                  <label>
                    <span>Data</span>
                    <input
                      defaultValue={formatReportInputDate(
                        row.entryStartedAt,
                        timezone,
                      )}
                      name="date"
                      required
                      type="date"
                    />
                  </label>
                  <span />
                  <label>
                    <span>Início</span>
                    <input
                      defaultValue={formatReportInputTime(
                        row.entryStartedAt,
                        timezone,
                      )}
                      name="startTime"
                      required
                      type="time"
                    />
                  </label>
                  <label>
                    <span>Fim</span>
                    <input
                      defaultValue={formatReportInputTime(
                        row.entryFinishedAt,
                        timezone,
                      )}
                      name="endTime"
                      required
                      type="time"
                    />
                  </label>
                </div>
                <label>
                  <span>Projeto</span>
                  <select
                    name="projectId"
                    onChange={(event) => {
                      setProjectId(event.currentTarget.value);
                      setWorkItemId("");
                    }}
                    value={projectId}
                  >
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Demanda</span>
                  <select
                    name="workItemId"
                    onChange={(event) =>
                      setWorkItemId(event.currentTarget.value)
                    }
                    required
                    value={workItemId}
                  >
                    <option value="">Selecione uma demanda</option>
                    {visibleWorkItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.externalIdentifier
                          ? `${item.externalIdentifier} · `
                          : ""}
                        {item.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Descrição</span>
                  <textarea
                    defaultValue={row.description ?? ""}
                    name="description"
                    rows={3}
                  />
                </label>
                <DialogFeedback state={correctState} />
                <div className="settings-dialog__actions">
                  <button
                    className="button button--ghost"
                    data-dialog-close
                    onClick={() => setDialog(null)}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    className="button button--primary"
                    disabled={correctPending}
                    type="submit"
                  >
                    {correctPending ? "Salvando…" : "Salvar correção"}
                  </button>
                </div>
              </form>
            ) : (
              <form action={archiveAction} className="settings-form">
                <div>
                  <span className="eyebrow">Registro concluído</span>
                  <h2 id={`${row.entryId}-archive-title`}>
                    Arquivar este registro?
                  </h2>
                  <p className="settings-dialog__description">
                    Ele deixa de aparecer nas visualizações e relatórios
                    aplicáveis, mas continua preservado para rastreabilidade.
                  </p>
                </div>
                <DialogFeedback state={archiveState} />
                <div className="settings-dialog__actions">
                  <button
                    className="button button--ghost"
                    data-dialog-close
                    onClick={() => setDialog(null)}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button
                    className="button button--destructive"
                    disabled={archivePending}
                    type="submit"
                  >
                    {archivePending ? "Arquivando…" : "Arquivar registro"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function DialogFeedback({ state }: { state: AdminTimeActionState }) {
  if (state.status === "idle") return null;
  return (
    <p aria-live="polite" className={`settings-feedback is-${state.status}`}>
      {state.message}
    </p>
  );
}
