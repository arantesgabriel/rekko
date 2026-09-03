"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { GettingStarted } from "@/components/timeline/getting-started";
import {
  saveManualTimeAction,
  type ManualTimeActionState,
} from "@/modules/timeline/actions";
import {
  finishTimerAction,
  type TimerActionState,
} from "@/modules/time-tracking/actions";

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

function dayLabel(date: string, timezone: string) {
  const label = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00Z`));
  return label.charAt(0).toLocaleUpperCase("pt-BR") + label.slice(1);
}

export function HomeView({
  blocks,
  date,
  gaps,
  gettingStarted,
  isToday,
  slug,
  targets,
  timezone,
  todayDate,
  trackedSeconds,
}: {
  blocks: Block[];
  date: string;
  gettingStarted?: {
    hasInvite: boolean;
    hasLinear: boolean;
    hasManualEntry: boolean;
    hasTrackedTask: boolean;
  };
  gaps: Gap[];
  isToday: boolean;
  slug: string;
  targets: Target;
  timezone: string;
  todayDate: string;
  trackedSeconds: number;
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
  const [now, setNow] = useState(0);
  const [finishState, finishAction, finishPending] = useActionState(
    async (previous: TimerActionState, formData: FormData) => {
      void formData;
      const next = await finishTimerAction(previous);
      if (next.status === "success") router.refresh();
      return next;
    },
    { status: "idle", message: "" } satisfies TimerActionState,
  );
  const filteredItems = useMemo(
    () => targets.items.filter((item) => item.projectId === projectId),
    [targets.items, projectId],
  );
  const all = useMemo(
    () =>
      [
        ...blocks.map((block) => ({
          kind: "block" as const,
          start: block.visibleStart,
          block,
        })),
        ...gaps.map((gap) => ({ kind: "gap" as const, start: gap.start, gap })),
      ].sort((a, b) => a.start.getTime() - b.start.getTime()),
    [blocks, gaps],
  );
  const demandCount = new Set(
    blocks.map((block) => block.workItemId).filter(Boolean),
  ).size;
  const activeBlock = isToday
    ? blocks.find((block) => block.active)
    : undefined;
  useEffect(() => {
    if (!activeBlock) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [activeBlock]);
  const activeDuration = activeBlock
    ? activeBlock.durationSeconds +
      Math.max(0, Math.floor((now - activeBlock.visibleEnd.getTime()) / 1000))
    : 0;

  function openEditor(value: NonNullable<typeof editor>) {
    setProjectId(value.projectId ?? targets.projects[0]?.id ?? "");
    setEditor(value);
  }

  function go(next: string) {
    router.push(next === todayDate ? `/w/${slug}` : `/w/${slug}?date=${next}`, {
      scroll: false,
    });
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Home</h1>
        <div className="home-day-total">
          <strong>{duration(trackedSeconds)}</strong>
          <span>{isToday ? "registradas hoje" : "registradas neste dia"}</span>
        </div>
        <nav className="home-date-nav" aria-label="Navegar entre dias">
          <button
            aria-label="Dia anterior"
            onClick={() => go(shiftDate(date, -1))}
            type="button"
          >
            ←
          </button>
          <label className="home-date-picker">
            <span>
              {isToday
                ? `Hoje, ${dayLabel(date, timezone).replace(/^\S+[-,]?\s*/u, "")}`
                : dayLabel(date, timezone)}
            </span>
            <input
              aria-label="Selecionar data"
              max={todayDate}
              onChange={(event) => event.target.value && go(event.target.value)}
              type="date"
              value={date}
            />
          </label>
          <button
            aria-label="Próximo dia"
            disabled={date >= todayDate}
            onClick={() => go(shiftDate(date, 1))}
            type="button"
          >
            →
          </button>
          {!isToday ? (
            <button
              aria-label="Hoje"
              className="home-date-nav__today"
              onClick={() => go(todayDate)}
              type="button"
            >
              Hoje
            </button>
          ) : null}
        </nav>
      </header>

      <section
        className={`home-now${activeBlock ? " is-active" : " is-idle"}`}
        aria-labelledby="home-now-title"
      >
        <div className="home-now__heading">
          <h2 id="home-now-title">Agora</h2>
          {activeBlock ? (
            <span>
              <i aria-hidden="true" /> Em andamento
            </span>
          ) : null}
        </div>
        {activeBlock ? (
          <div className="home-now__active">
            <div className="home-now__activity">
              <strong>
                {activeBlock.workItemTitle ?? activeBlock.projectName}
              </strong>
              <span>
                {activeBlock.workItemTitle
                  ? activeBlock.projectName
                  : "Projeto"}
              </span>
            </div>
            <div className="home-now__clock">
              <time>{duration(activeDuration)}</time>
              <span>
                Iniciado às {localTime(activeBlock.visibleStart, timezone)}
              </span>
            </div>
            <form action={finishAction}>
              <button
                className="button button--secondary"
                disabled={finishPending}
                type="submit"
              >
                {finishPending ? "Finalizando…" : "Finalizar"}
              </button>
            </form>
          </div>
        ) : (
          <div className="home-now__idle">
            <div>
              <strong>Nenhuma atividade em andamento.</strong>
              <span>
                Selecione uma demanda para começar a registrar seu tempo.
              </span>
            </div>
            <Link className="button button--primary" href={`/w/${slug}/work`}>
              Iniciar atividade
            </Link>
          </div>
        )}
        {finishState.status === "error" ? (
          <p className="form-message form-message--error" role="alert">
            {finishState.message}
          </p>
        ) : null}
      </section>

      <section className="home-timeline" aria-labelledby="home-timeline-title">
        <div className="home-section-heading">
          <h2 id="home-timeline-title">Registros</h2>
          <span>
            {duration(trackedSeconds)} · {demandCount}{" "}
            {demandCount === 1 ? "demanda" : "demandas"}
          </span>
          <button
            aria-label="Adicionar tempo"
            className="home-add-time"
            onClick={() => openEditor({ start: "09:00", end: "10:00" })}
            type="button"
          >
            + Adicionar registro
          </button>
        </div>

        {all.length ? (
          <ol className="home-timeline-list">
            {all.map((item) =>
              item.kind === "block" ? (
                <TimelineEntry
                  block={item.block}
                  key={`${item.block.entryId}-${item.block.visibleStart.toISOString()}`}
                  onEdit={() =>
                    item.block.source === "MANUAL"
                      ? openEditor({
                          entryId: item.block.entryId,
                          start: localTime(item.block.visibleStart, timezone),
                          end: localTime(item.block.visibleEnd, timezone),
                          projectId: item.block.projectId,
                          workItemId: item.block.workItemId,
                          description: item.block.description,
                        })
                      : undefined
                  }
                  timezone={timezone}
                />
              ) : (
                <TimelineGap
                  gap={item.gap}
                  key={`gap-${item.gap.start.toISOString()}`}
                  onReconstruct={() =>
                    openEditor({
                      start: localTime(item.gap.start, timezone),
                      end: localTime(item.gap.end, timezone),
                      reconstruction: true,
                    })
                  }
                  timezone={timezone}
                />
              ),
            )}
          </ol>
        ) : (
          <div className="today-empty">
            <h2 className="sr-only">Nenhum tempo registrado neste dia.</h2>
            <p>Ainda não há registros {isToday ? "hoje" : "neste dia"}.</p>
          </div>
        )}
        {all.length > 0 && trackedSeconds > 0 ? (
          <div className="home-timeline__footer">
            <Link href={`/w/${slug}/insights`}>
              Ver insights <span aria-hidden="true">→</span>
            </Link>
          </div>
        ) : null}
      </section>

      {isToday && gettingStarted ? (
        <GettingStarted progress={gettingStarted} slug={slug} />
      ) : null}

      {editor ? (
        <div className="time-drawer-backdrop">
          <button
            aria-label="Fechar painel"
            onClick={() => setEditor(null)}
            type="button"
          />
          <aside
            aria-labelledby="manual-time-title"
            aria-modal="true"
            className="time-drawer"
            role="dialog"
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
                aria-label="Fechar"
                className="button button--ghost button--icon"
                onClick={() => setEditor(null)}
                type="button"
              >
                ×
              </button>
            </header>
            <form action={action} className="time-form">
              <input
                name="entryId"
                type="hidden"
                value={editor.entryId ?? ""}
              />
              <input name="date" type="hidden" value={date} />
              <div className="form-row">
                <label>
                  Início
                  <input
                    defaultValue={editor.start}
                    name="startTime"
                    required
                    type="time"
                  />
                </label>
                <label>
                  Fim
                  <input
                    defaultValue={editor.end}
                    name="endTime"
                    required
                    type="time"
                  />
                </label>
              </div>
              <label>
                Projeto
                <select
                  name="projectId"
                  onChange={(event) => setProjectId(event.target.value)}
                  required
                  value={projectId}
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
                  defaultValue={editor.workItemId ?? ""}
                  name="workItemId"
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
                  defaultValue={editor.description ?? ""}
                  maxLength={2000}
                  name="description"
                  rows={4}
                />
              </label>
              {state.status === "error" ? (
                <p className="form-message form-message--error" role="alert">
                  {state.message}
                </p>
              ) : null}
              <footer>
                <button
                  className="button button--secondary"
                  onClick={() => setEditor(null)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="button button--primary"
                  disabled={pending}
                  type="submit"
                >
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
      ) : null}
    </div>
  );
}

function TimelineEntry({
  block,
  onEdit,
  timezone,
}: {
  block: Block;
  onEdit: () => void;
  timezone: string;
}) {
  const title = block.workItemTitle ?? block.projectName;
  const context = block.workItemTitle ? block.projectName : block.description;
  return (
    <li className={`home-timeline-entry${block.active ? " is-active" : ""}`}>
      <div className="home-timeline-entry__time">
        <time>{localTime(block.visibleStart, timezone)}</time>
        <span>
          {block.active ? "agora" : localTime(block.visibleEnd, timezone)}
        </span>
      </div>
      <span className="home-timeline-entry__rail" aria-hidden="true" />
      <article
        aria-label={`${title}, ${localTime(block.visibleStart, timezone)} até ${localTime(block.visibleEnd, timezone)}, ${duration(block.durationSeconds)}`}
        className="home-timeline-block timeline-block"
      >
        <div className="home-timeline-block__copy">
          <strong>{title}</strong>
          {context ? <span>{context}</span> : null}
        </div>
        <div className="home-timeline-block__details">
          <time>{duration(block.durationSeconds)}</time>
          {block.source === "MANUAL" ? (
            <details className="home-entry-actions">
              <summary aria-label="Mais ações" title="Mais ações">
                ···
              </summary>
              <div>
                <button onClick={onEdit} type="button">
                  Editar
                </button>
              </div>
            </details>
          ) : null}
        </div>
      </article>
    </li>
  );
}

function TimelineGap({
  gap,
  onReconstruct,
  timezone,
}: {
  gap: Gap;
  onReconstruct: () => void;
  timezone: string;
}) {
  const seconds = Math.max(
    0,
    Math.floor((gap.end.getTime() - gap.start.getTime()) / 1000),
  );
  return (
    <li className="home-timeline-gap">
      <div className="home-timeline-entry__time">
        <time>{localTime(gap.start, timezone)}</time>
        <span>{localTime(gap.end, timezone)}</span>
      </div>
      <span className="home-timeline-entry__rail is-gap" aria-hidden="true" />
      <div className="home-timeline-gap__content">
        <span>{duration(seconds)} sem registro</span>
        <button
          className="button button--ghost button--sm"
          onClick={onReconstruct}
          type="button"
        >
          Reconstruir
        </button>
      </div>
    </li>
  );
}
