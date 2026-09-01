"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GettingStarted } from "@/components/timeline/getting-started";
import {
  saveManualTimeAction,
  type ManualTimeActionState,
} from "@/modules/timeline/actions";

type Block = {
  entryId: string;
  source: "TIMER" | "MANUAL";
  status: string;
  description: string | null;
  projectId: string;
  projectName: string;
  workItemId: string | null;
  workItemTitle: string | null;
  visibleStart: Date;
  visibleEnd: Date;
  durationSeconds: number;
  active: boolean;
};
type Gap = { start: Date; end: Date };
type Target = {
  projects: { id: string; name: string }[];
  items: { id: string; projectId: string; title: string }[];
};
const initialState: ManualTimeActionState = { status: "idle", message: "" };

function duration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return [hours ? `${hours}h` : "", minutes || !hours ? `${minutes}m` : ""]
    .filter(Boolean)
    .join(" ");
}
function localTime(value: Date, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}
function shiftDate(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

export function TodayView({
  slug,
  date,
  timezone,
  blocks,
  gaps,
  trackedSeconds,
  isToday,
  targets,
  gettingStarted,
}: {
  slug: string;
  date: string;
  timezone: string;
  blocks: Block[];
  gaps: Gap[];
  trackedSeconds: number;
  isToday: boolean;
  targets: Target;
  gettingStarted?: {
    hasInvite: boolean;
    hasLinear: boolean;
    hasManualEntry: boolean;
    hasTrackedTask: boolean;
  };
}) {
  const router = useRouter();
  const [editor, setEditor] = useState<null | {
    entryId?: string;
    start: string;
    end: string;
    projectId?: string;
    workItemId?: string | null;
    description?: string | null;
    reconstruction?: boolean;
  }>(null);
  const [state, action, pending] = useActionState(
    async (previous: ManualTimeActionState, formData: FormData) => {
      const next = await saveManualTimeAction(slug, previous, formData);
      if (next.status === "success") {
        setEditor(null);
        router.refresh();
      }
      return next;
    },
    initialState,
  );
  const [projectId, setProjectId] = useState("");
  const filteredItems = useMemo(
    () => targets.items.filter((item) => item.projectId === projectId),
    [targets.items, projectId],
  );
  function openEditor(value: NonNullable<typeof editor>) {
    setProjectId(value.projectId ?? targets.projects[0]?.id ?? "");
    setEditor(value);
  }
  const go = (next: string) => router.push(`/w/${slug}?date=${next}`);
  const all = [
    ...blocks.map((block) => ({
      kind: "block" as const,
      start: block.visibleStart,
      block,
    })),
    ...gaps.map((gap) => ({ kind: "gap" as const, start: gap.start, gap })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime());
  return (
    <div className="today-page">
      <header className="today-header">
        <div>
          <p className="page-eyebrow">{isToday ? "Hoje" : "Timeline"}</p>
          <h1>
            {new Intl.DateTimeFormat("pt-BR", {
              timeZone: timezone,
              weekday: "long",
              day: "2-digit",
              month: "long",
            }).format(new Date(`${date}T12:00:00Z`))}
          </h1>
        </div>
        <div className="today-date-nav" aria-label="Navegar entre dias">
          <button
            className="button button--ghost button--icon"
            onClick={() => go(shiftDate(date, -1))}
            aria-label="Dia anterior"
          >
            ←
          </button>
          <button
            className="button button--secondary"
            onClick={() => router.push(`/w/${slug}`)}
          >
            Hoje
          </button>
          <button
            className="button button--ghost button--icon"
            onClick={() => go(shiftDate(date, 1))}
            aria-label="Próximo dia"
          >
            →
          </button>
        </div>
      </header>
      <section className="today-summary" aria-labelledby="tracked-title">
        <div>
          <span id="tracked-title">Registrado neste dia</span>
          <strong>{duration(trackedSeconds)}</strong>
        </div>
        <button
          className="button button--primary"
          onClick={() => openEditor({ start: "09:00", end: "10:00" })}
        >
          Adicionar tempo
        </button>
      </section>
      {isToday && gettingStarted ? (
        <GettingStarted progress={gettingStarted} slug={slug} />
      ) : null}
      <section className="timeline-section" aria-labelledby="timeline-title">
        <div className="timeline-heading">
          <div>
            <h2 id="timeline-title">Timeline</h2>
            <p>Seu dia, em ordem cronológica.</p>
          </div>
        </div>
        {all.length ? (
          <ol className="timeline-list">
            {all.map((item) =>
              item.kind === "block" ? (
                <li
                  className={`timeline-row timeline-row--block${item.block.active ? " is-active" : ""}`}
                  key={`${item.block.entryId}-${item.block.visibleStart.toISOString()}`}
                >
                  <time>{localTime(item.block.visibleStart, timezone)}</time>
                  <span className="timeline-rail" aria-hidden="true" />
                  <article
                    className="timeline-block"
                    aria-label={`${item.block.projectName}, ${localTime(item.block.visibleStart, timezone)} até ${localTime(item.block.visibleEnd, timezone)}, ${duration(item.block.durationSeconds)}`}
                  >
                    <div>
                      <span>
                        {item.block.active
                          ? "Em andamento"
                          : item.block.source === "MANUAL"
                            ? "Manual"
                            : "Timer"}
                      </span>
                      <strong>
                        {item.block.workItemTitle ?? item.block.projectName}
                      </strong>
                      <small>
                        {item.block.workItemTitle
                          ? item.block.projectName
                          : item.block.description}
                      </small>
                    </div>
                    <div className="timeline-block__meta">
                      <b>{duration(item.block.durationSeconds)}</b>
                      {item.block.source === "MANUAL" && (
                        <button
                          className="button button--ghost button--sm"
                          onClick={() =>
                            openEditor({
                              entryId: item.block.entryId,
                              start: localTime(
                                item.block.visibleStart,
                                timezone,
                              ),
                              end: localTime(item.block.visibleEnd, timezone),
                              projectId: item.block.projectId,
                              workItemId: item.block.workItemId,
                              description: item.block.description,
                            })
                          }
                        >
                          Editar
                        </button>
                      )}
                    </div>
                  </article>
                </li>
              ) : (
                <li
                  className="timeline-row timeline-row--gap"
                  key={`gap-${item.gap.start.toISOString()}`}
                >
                  <time>{localTime(item.gap.start, timezone)}</time>
                  <span className="timeline-rail" aria-hidden="true" />
                  <div className="timeline-gap">
                    <div>
                      <strong>
                        {duration(
                          (item.gap.end.getTime() - item.gap.start.getTime()) /
                            1000,
                        )}{" "}
                        sem registro
                      </strong>
                      <span>
                        {localTime(item.gap.start, timezone)} —{" "}
                        {localTime(item.gap.end, timezone)}
                      </span>
                    </div>
                    <button
                      className="button button--secondary button--sm"
                      onClick={() =>
                        openEditor({
                          start: localTime(item.gap.start, timezone),
                          end: localTime(item.gap.end, timezone),
                          reconstruction: true,
                        })
                      }
                    >
                      Reconstruir
                    </button>
                  </div>
                </li>
              ),
            )}
          </ol>
        ) : (
          <div className="today-empty">
            <span
              className="segment-mark segment-mark--brand"
              aria-hidden="true"
            >
              <i />
              <i />
              <i />
            </span>
            <h2>Nenhum tempo registrado neste dia.</h2>
            <p>
              Inicie uma atividade ou adicione um período para começar a
              reconstruir sua jornada.
            </p>
            <div>
              <Link
                className="button button--secondary"
                href={`/w/${slug}/work`}
              >
                Escolher atividade
              </Link>
              <button
                className="button button--primary"
                onClick={() => openEditor({ start: "09:00", end: "10:00" })}
              >
                Adicionar tempo
              </button>
            </div>
          </div>
        )}
      </section>
      {editor && (
        <div className="time-drawer-backdrop">
          <button aria-label="Fechar painel" onClick={() => setEditor(null)} />
          <aside
            className="time-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manual-time-title"
          >
            <header>
              <div>
                <p>
                  {editor.reconstruction
                    ? "Reconstruir período"
                    : editor.entryId
                      ? "Editar tempo"
                      : "Adicionar tempo"}
                </p>
                <h2 id="manual-time-title">
                  {editor.start} — {editor.end}
                </h2>
              </div>
              <button
                className="button button--ghost button--icon"
                onClick={() => setEditor(null)}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>
            <form action={action} className="time-form">
              <input
                type="hidden"
                name="entryId"
                value={editor.entryId ?? ""}
              />
              <input type="hidden" name="date" value={date} />
              <div className="form-row">
                <label>
                  Início
                  <input
                    name="startTime"
                    type="time"
                    defaultValue={editor.start}
                    required
                  />
                </label>
                <label>
                  Fim
                  <input
                    name="endTime"
                    type="time"
                    defaultValue={editor.end}
                    required
                  />
                </label>
              </div>
              <label>
                Projeto
                <select
                  name="projectId"
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  required
                >
                  <option value="">Selecione</option>
                  {targets.projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Demanda <span>opcional</span>
                <select
                  name="workItemId"
                  defaultValue={editor.workItemId ?? ""}
                >
                  <option value="">Somente o projeto</option>
                  {filteredItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Descrição <span>opcional</span>
                <textarea
                  name="description"
                  defaultValue={editor.description ?? ""}
                  rows={4}
                  maxLength={2000}
                />
              </label>
              {state.status === "error" && (
                <p className="form-message form-message--error" role="alert">
                  {state.message}
                </p>
              )}
              <footer>
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => setEditor(null)}
                >
                  Cancelar
                </button>
                <button className="button button--primary" disabled={pending}>
                  {pending
                    ? "Salvando…"
                    : editor.reconstruction
                      ? "Salvar período"
                      : "Salvar tempo"}
                </button>
              </footer>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}
