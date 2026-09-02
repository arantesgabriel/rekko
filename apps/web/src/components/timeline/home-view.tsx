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

function dayLabel(date: string, timezone: string) {
  const label = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00Z`));
  return label.charAt(0).toLocaleUpperCase("pt-BR") + label.slice(1);
}

function weekdayLabel(date: string, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    weekday: "short",
  })
    .format(new Date(`${date}T12:00:00Z`))
    .replace(".", "")
    .slice(0, 3);
}

function mondayOf(date: string) {
  const value = new Date(`${date}T12:00:00Z`);
  const day = value.getUTCDay();
  value.setUTCDate(value.getUTCDate() - (day === 0 ? 6 : day - 1));
  return value.toISOString().slice(0, 10);
}

function greetingForHour(hour: number) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
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
  userName,
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
  userName: string;
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
  const weekStart = mondayOf(date);
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
  const firstBlock = blocks[0];
  const lastBlock = blocks.at(-1);
  const demandCount = new Set(
    blocks.map((block) => block.workItemId).filter(Boolean),
  ).size;
  const firstName = userName.trim().split(/\s+/)[0] || "por aqui";
  const currentHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date()),
  );
  const greeting = greetingForHour(currentHour);

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
        <div className="home-header__copy">
          <p className="home-header__eyebrow">
            {greeting}, {firstName}
          </p>
          <h1>Seu dia em contexto</h1>
          <p>
            {dayLabel(date, timezone)} · uma leitura simples do tempo que
            aconteceu.
          </p>
        </div>
        <div className="home-header__metric">
          <span>
            {isToday ? "Hoje você registrou" : "Neste dia você registrou"}
          </span>
          <strong>{duration(trackedSeconds)}</strong>
          <Link href={`/w/${slug}/insights`}>
            Ver análise completa <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>

      <nav className="home-day-selector" aria-label="Selecionar dia">
        {Array.from({ length: 7 }, (_, index) => {
          const day = shiftDate(weekStart, index);
          const selected = day === date;
          const current = day === todayDate;
          return (
            <button
              aria-current={selected ? "date" : undefined}
              className={`${selected ? "is-selected" : ""}${current ? " is-today" : ""}`}
              key={day}
              onClick={() => go(day)}
              type="button"
            >
              <span>{weekdayLabel(day, timezone)}</span>
              <strong>{day.slice(-2)}</strong>
              {current ? <small>hoje</small> : null}
            </button>
          );
        })}
      </nav>

      <section className="home-summary" aria-label="Resumo do dia">
        <div className="home-summary__primary">
          <span>Tempo registrado</span>
          <strong>{duration(trackedSeconds)}</strong>
        </div>
        <div>
          <span>Primeira entrada</span>
          <strong>
            {firstBlock ? localTime(firstBlock.visibleStart, timezone) : "—"}
          </strong>
        </div>
        <div>
          <span>Último registro</span>
          <strong>
            {lastBlock ? localTime(lastBlock.visibleEnd, timezone) : "—"}
          </strong>
        </div>
        <div>
          <span>Demandas</span>
          <strong>{demandCount || "—"}</strong>
        </div>
        <button
          className="button button--secondary home-summary__action"
          onClick={() => openEditor({ start: "09:00", end: "10:00" })}
          type="button"
        >
          + Adicionar tempo
        </button>
      </section>

      {isToday && gettingStarted ? (
        <GettingStarted progress={gettingStarted} slug={slug} />
      ) : null}

      <section className="home-timeline" aria-labelledby="home-timeline-title">
        <div className="home-section-heading">
          <div>
            <p className="home-section-heading__eyebrow">A jornada do dia</p>
            <h2 id="home-timeline-title">Timeline</h2>
          </div>
          <div className="home-timeline__nav">
            <button
              aria-label="Dia anterior"
              className="button button--ghost button--icon button--sm"
              onClick={() => go(shiftDate(date, -1))}
              type="button"
            >
              ←
            </button>
            <button
              className="button button--ghost button--sm"
              disabled={isToday}
              onClick={() => go(todayDate)}
              type="button"
            >
              Hoje
            </button>
            <button
              aria-label="Próximo dia"
              className="button button--ghost button--icon button--sm"
              onClick={() => go(shiftDate(date, 1))}
              type="button"
            >
              →
            </button>
          </div>
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
                type="button"
              >
                Adicionar tempo
              </button>
            </div>
          </div>
        )}
      </section>

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
        <span aria-hidden="true">{localTime(block.visibleEnd, timezone)}</span>
      </div>
      <span className="home-timeline-entry__rail" aria-hidden="true" />
      <article
        aria-label={`${title}, ${localTime(block.visibleStart, timezone)} até ${localTime(block.visibleEnd, timezone)}, ${duration(block.durationSeconds)}`}
        className="home-timeline-block timeline-block"
      >
        <div className="home-timeline-block__copy">
          <div className="home-timeline-block__meta">
            <span className="home-timeline-block__project">
              {block.projectName}
            </span>
            <span
              className={`home-timeline-block__source${block.source === "MANUAL" ? " is-manual" : ""}`}
            >
              {block.active
                ? "● Em andamento"
                : block.source === "MANUAL"
                  ? "Editado manualmente"
                  : "Registrado"}
            </span>
          </div>
          <strong>{title}</strong>
          {context ? <span>{context}</span> : null}
        </div>
        <div className="home-timeline-block__details">
          <time>{duration(block.durationSeconds)}</time>
          {block.source === "MANUAL" ? (
            <button
              className="button button--ghost button--sm"
              onClick={onEdit}
              type="button"
            >
              Editar
            </button>
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
        <span aria-hidden="true">{localTime(gap.end, timezone)}</span>
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
