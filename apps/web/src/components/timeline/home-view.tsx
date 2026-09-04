"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { GettingStarted } from "@/components/timeline/getting-started";
import { StartTimerButton } from "@/components/time-tracking/timer-controls";
import { useOptionalActiveSession } from "@/components/time-tracking/active-session-provider";
import { PageHeader } from "@/components/ui/page-header";
import {
  saveManualTimeAction,
  type ManualTimeActionState,
} from "@/modules/timeline/actions";
import {
  addCalendarDays,
  calculateGaps,
  formatCompactDuration,
  formatWeekStripDuration,
  isDisplayableSession,
} from "@/modules/timeline/domain";

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
type RecentItem = {
  id: string;
  projectId: string;
  title: string;
  projectName: string;
};
type WeekDay = { date: string; trackedSeconds: number };

const initialState: ManualTimeActionState = { status: "idle", message: "" };
const WEEKDAY_LABELS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

function localTime(value: Date, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
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

function compactDate(date: string, timezone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    day: "2-digit",
    month: "short",
  })
    .format(new Date(`${date}T12:00:00Z`))
    .replace(".", "")
    .replace(" de ", " ");
}

export function HomeView({
  blocks,
  date,
  gettingStarted,
  isToday,
  recentItems,
  slug,
  targets,
  timezone,
  todayDate,
  trackedSeconds,
  weekDays,
}: {
  blocks: Block[];
  date: string;
  gettingStarted?: {
    hasInvite: boolean;
    hasLinear: boolean;
    hasManualEntry: boolean;
    hasTrackedTask: boolean;
  };
  isToday: boolean;
  recentItems: RecentItem[];
  slug: string;
  targets: Target;
  timezone: string;
  todayDate: string;
  trackedSeconds: number;
  weekDays: WeekDay[];
}) {
  const tracking = useOptionalActiveSession();
  const hasActiveTimer = Boolean(tracking?.session);
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
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
  const displayBlocks = useMemo(
    () => blocks.filter(isDisplayableSession),
    [blocks],
  );
  const displayGaps = useMemo(
    () =>
      calculateGaps(
        displayBlocks.map((block) => ({
          start: block.visibleStart,
          end: block.visibleEnd,
        })),
      ),
    [displayBlocks],
  );
  const all = useMemo(
    () =>
      [
        ...displayBlocks.map((block) => ({
          kind: "block" as const,
          start: block.visibleStart,
          block,
        })),
        ...displayGaps.map((gap) => ({
          kind: "gap" as const,
          start: gap.start,
          gap,
        })),
      ].sort((a, b) => a.start.getTime() - b.start.getTime()),
    [displayBlocks, displayGaps],
  );
  const activeBlock = isToday
    ? displayBlocks.find((block) => block.active)
    : undefined;
  const nowActivity =
    isToday && tracking?.session
      ? {
          workItemTitle: tracking.session.workItemTitle,
          projectName: tracking.session.projectName,
        }
      : activeBlock;
  const continueItems = useMemo(() => {
    if (hasActiveTimer || !isToday) return [];
    return recentItems
      .filter((item) => item.id !== activeBlock?.workItemId)
      .slice(0, 4);
  }, [activeBlock?.workItemId, hasActiveTimer, isToday, recentItems]);
  const pickerItems = useMemo(() => {
    const query = pickerQuery.trim().toLowerCase();
    const byId = new Map(
      targets.projects.map((project) => [project.id, project.name]),
    );
    const ranked = [
      ...recentItems,
      ...targets.items
        .filter((item) => !recentItems.some((recent) => recent.id === item.id))
        .map((item) => ({
          id: item.id,
          projectId: item.projectId,
          title: item.title,
          projectName: byId.get(item.projectId) ?? "Projeto",
        })),
    ];
    if (!query) return ranked.slice(0, 8);
    return ranked
      .filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.projectName.toLowerCase().includes(query),
      )
      .slice(0, 8);
  }, [pickerQuery, recentItems, targets.items, targets.projects]);
  const weekTotal = weekDays.reduce(
    (total, day) => total + day.trackedSeconds,
    0,
  );
  const isFuture = date > todayDate;
  const overlayOpen = pickerOpen || Boolean(editor);

  useEffect(() => {
    if (!overlayOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setPickerOpen(false);
      setEditor(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [overlayOpen]);

  function openEditor(value: NonNullable<typeof editor>) {
    setProjectId(value.projectId ?? targets.projects[0]?.id ?? "");
    setEditor(value);
  }

  function go(next: string) {
    router.push(next === todayDate ? `/w/${slug}` : `/w/${slug}?date=${next}`, {
      scroll: false,
    });
  }

  function openStart() {
    if (!targets.items.length) return;
    setPickerQuery("");
    setPickerOpen(true);
  }

  return (
    <div className="home-page">
      <PageHeader description={dayLabel(date, timezone)} title="Home" />

      <div className="home-week-row">
        <WeekStrip
          date={date}
          onSelect={go}
          todayDate={todayDate}
          weekDays={weekDays}
        />
        <div className="home-week-tools">
          {!isToday ? (
            <button
              className="button button--ghost button--sm"
              onClick={() => go(todayDate)}
              type="button"
            >
              Hoje
            </button>
          ) : null}
          <label className="home-date-picker">
            <span aria-hidden="true">{compactDate(date, timezone)}</span>
            <input
              aria-label="Selecionar data"
              max={todayDate}
              onChange={(event) => event.target.value && go(event.target.value)}
              type="date"
              value={date}
            />
          </label>
        </div>
      </div>

      {isToday ? (
        <section
          className={`home-now${nowActivity ? " is-active" : " is-idle"}`}
          aria-labelledby="home-now-title"
        >
          <h2 id="home-now-title">Agora</h2>
          {nowActivity ? (
            <div className="home-now__active">
              <span className="home-now__dot" aria-hidden="true" />
              <div className="home-now__activity">
                <strong>
                  {nowActivity.workItemTitle ?? nowActivity.projectName}
                </strong>
                <span>
                  {nowActivity.workItemTitle
                    ? nowActivity.projectName
                    : "Projeto"}
                </span>
              </div>
            </div>
          ) : targets.items.length === 0 ? (
            <div className="home-now__idle">
              <p>
                Nenhuma demanda disponível. Crie uma demanda para começar a
                registrar seu tempo.
              </p>
              <Link
                className="button button--primary"
                href={`/w/${slug}/work/new`}
              >
                Criar demanda
              </Link>
            </div>
          ) : (
            <div className="home-now__idle">
              <p>Nenhuma atividade em andamento</p>
              <button
                className="button button--primary"
                onClick={openStart}
                type="button"
              >
                <span aria-hidden="true">+</span> Iniciar atividade
              </button>
            </div>
          )}
        </section>
      ) : (
        <p className="home-day-hint">
          {isFuture
            ? "Ainda não há registros para este dia."
            : "Neste dia você pode adicionar registros ou reconstruir períodos sem registro."}
        </p>
      )}

      <section className="home-timeline" aria-labelledby="home-timeline-title">
        <div className="home-section-heading">
          <div className="home-section-heading__lead">
            <h2 id="home-timeline-title">Registros</h2>
            <span className="home-section-heading__total">
              {formatCompactDuration(trackedSeconds)}
            </span>
          </div>
          <button
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
          <div className="home-empty">
            <p className="home-empty__title">
              {isToday
                ? "Nenhum tempo registrado hoje."
                : "Nenhum tempo registrado neste dia."}
            </p>
            <p>
              {isToday
                ? "Comece uma atividade acima ou registre algo que você já fez."
                : "Adicione um registro do que aconteceu neste dia."}
            </p>
            <button
              className="home-add-time"
              onClick={() => openEditor({ start: "09:00", end: "10:00" })}
              type="button"
            >
              + Adicionar registro
            </button>
          </div>
        )}

        <div className="home-week-context">
          <span>Esta semana · {formatCompactDuration(weekTotal)}</span>
          <Link href={`/w/${slug}/insights`}>
            Ver insights <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {continueItems.length > 0 ? (
        <section
          className="home-continue"
          aria-labelledby="home-continue-title"
        >
          <h2 id="home-continue-title">Continuar trabalhando</h2>
          <ul>
            {continueItems.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.projectName}</span>
                </div>
                <StartTimerButton
                  slug={slug}
                  projectId={item.projectId}
                  workItemId={item.id}
                  projectName={item.projectName}
                  workItemTitle={item.title}
                />
              </li>
            ))}
          </ul>
          <Link className="home-continue__more" href={`/w/${slug}/work`}>
            Ver demandas <span aria-hidden="true">→</span>
          </Link>
        </section>
      ) : null}

      {isToday && gettingStarted ? (
        <GettingStarted progress={gettingStarted} slug={slug} />
      ) : null}

      {pickerOpen ? (
        <div className="time-drawer-backdrop">
          <button
            aria-label="Fechar seleção"
            onClick={() => setPickerOpen(false)}
            type="button"
          />
          <aside
            aria-labelledby="quick-start-title"
            aria-modal="true"
            className="time-drawer time-drawer--pick"
            role="dialog"
          >
            <header>
              <h2 id="quick-start-title">Escolha uma demanda</h2>
              <button
                aria-label="Fechar"
                className="button button--ghost button--icon"
                onClick={() => setPickerOpen(false)}
                type="button"
              >
                ×
              </button>
            </header>
            <div className="home-quick-start">
              <label className="home-quick-start__search">
                <span className="sr-only">Buscar demanda ou projeto</span>
                <input
                  autoFocus
                  onChange={(event) => setPickerQuery(event.target.value)}
                  placeholder="Buscar demanda ou projeto…"
                  type="search"
                  value={pickerQuery}
                />
              </label>
              {pickerItems.length ? (
                <ul>
                  {pickerItems.map((item) => (
                    <li key={item.id}>
                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.projectName}</span>
                      </div>
                      <StartTimerButton
                        slug={slug}
                        projectId={item.projectId}
                        workItemId={item.id}
                        projectName={item.projectName}
                        workItemTitle={item.title}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="home-quick-start__empty">
                  Nenhuma demanda encontrada.
                </p>
              )}
            </div>
          </aside>
        </div>
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
                Demanda
                <select
                  defaultValue={editor.workItemId ?? ""}
                  name="workItemId"
                  required
                >
                  <option value="">Selecione uma demanda</option>
                  {targets.items
                    .filter((item) => item.projectId === projectId)
                    .map((item) => (
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

function WeekStrip({
  date,
  onSelect,
  todayDate,
  weekDays,
}: {
  date: string;
  onSelect: (next: string) => void;
  todayDate: string;
  weekDays: WeekDay[];
}) {
  const weekStart = weekDays[0]?.date;
  useEffect(() => {
    document
      .querySelector(".home-week__day.is-selected")
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [date]);
  return (
    <nav className="home-week" aria-label="Dias da semana">
      <button
        aria-label="Semana anterior"
        className="home-week__shift"
        onClick={() => weekStart && onSelect(addCalendarDays(weekStart, -1))}
        type="button"
      >
        ←
      </button>
      <div className="home-week__days">
        {weekDays.map((day, index) => {
          const selected = day.date === date;
          const disabled = day.date > todayDate;
          return (
            <button
              aria-current={selected ? "date" : undefined}
              aria-label={`${WEEKDAY_LABELS[index]}, ${formatWeekStripDuration(day.trackedSeconds)}`}
              className={`home-week__day${selected ? " is-selected" : ""}`}
              disabled={disabled}
              key={day.date}
              onClick={() => onSelect(day.date)}
              type="button"
            >
              <span>{WEEKDAY_LABELS[index]}</span>
              <strong>{formatWeekStripDuration(day.trackedSeconds)}</strong>
            </button>
          );
        })}
      </div>
      <button
        aria-label="Próxima semana"
        className="home-week__shift"
        disabled={!weekDays[6] || weekDays[6].date >= todayDate}
        onClick={() =>
          weekDays[6] && onSelect(addCalendarDays(weekDays[6].date, 1))
        }
        type="button"
      >
        →
      </button>
    </nav>
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
  const endLabel = block.active
    ? "agora"
    : localTime(block.visibleEnd, timezone);
  return (
    <li className={`home-timeline-entry${block.active ? " is-active" : ""}`}>
      <div className="home-timeline-entry__time">
        <time dateTime={block.visibleStart.toISOString()}>
          {localTime(block.visibleStart, timezone)}
        </time>
        <span>{endLabel}</span>
      </div>
      <span className="home-timeline-entry__rail" aria-hidden="true" />
      <article
        aria-label={`${title}, ${localTime(block.visibleStart, timezone)} até ${endLabel}, ${formatCompactDuration(block.durationSeconds)}`}
        className="home-timeline-block"
      >
        <div className="home-timeline-block__copy">
          <strong>{title}</strong>
          {block.workItemTitle ? <span>{block.projectName}</span> : null}
        </div>
        <div className="home-timeline-block__details">
          <time>{formatCompactDuration(block.durationSeconds)}</time>
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
        <span>{formatCompactDuration(seconds)} sem registro</span>
        <button
          className="home-reconstruct"
          onClick={onReconstruct}
          type="button"
        >
          Reconstruir →
        </button>
      </div>
    </li>
  );
}
