"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

import { DemandActionsMenu } from "@/components/demands/demand-actions-menu";
import { DemandStatus } from "@/components/demands/demand-status";
import {
  formatTracked,
  formatUpdated,
} from "@/components/projects/project-format";
import { StartTimerButton } from "@/components/time-tracking/timer-controls";
import { useOptionalActiveSession } from "@/components/time-tracking/active-session-provider";
import { formatEstimate } from "@/modules/projects/domain";
import type {
  DemandListItem,
  DemandProjectOption,
} from "@/modules/projects/service";

function demandTitle(demand: DemandListItem) {
  return demand.externalIdentifier
    ? `${demand.externalIdentifier} · ${demand.title}`
    : demand.title;
}

export function DemandRow({
  canManage,
  context,
  demand,
  onEdit,
  onFeedback,
  onOpen,
  onChanged,
  projects,
  slug,
  timezone,
  childCount = 0,
  completedChildCount = 0,
  expanded = false,
  level = 0,
  onToggle,
  onCreateChild,
  selected = false,
  showChildProgress = false,
  treeLines = [],
}: {
  canManage?: boolean;
  context: "workspace" | "project";
  demand: DemandListItem;
  onChanged?: () => void;
  onEdit?: () => void;
  onFeedback?: (message: string) => void;
  onOpen: (demandId: string) => void;
  projects?: DemandProjectOption[];
  slug: string;
  timezone: string;
  childCount?: number;
  completedChildCount?: number;
  expanded?: boolean;
  level?: number;
  onToggle?: () => void;
  onCreateChild?: () => void;
  selected?: boolean;
  showChildProgress?: boolean;
  treeLines?: boolean[];
}) {
  const title = demandTitle(demand);
  const updated = formatUpdated(demand.lastActivityAt, timezone);
  const tracked = formatTracked(demand.trackedSeconds);
  const estimate = demand.estimatedMinutes
    ? formatEstimate(demand.estimatedMinutes)
    : "—";
  const canStart =
    demand.projectStatus === "ACTIVE" &&
    demand.isActive &&
    demand.status !== "DONE";
  const tracking = useOptionalActiveSession();
  const sessionOnItem = tracking?.session?.workItemId === demand.id;
  const ancestorContext =
    level === 0 && demand.parentWorkItemId && demand.workItemBreadcrumb
      ? demand.workItemBreadcrumb.split(" / ").slice(0, -1).join(" / ")
      : "";

  function openUnlessControl(target: EventTarget | null) {
    const node = target instanceof Element ? target : null;
    if (node?.closest("a, button, select, textarea, input, [role='menu']"))
      return;
    onOpen(demand.id);
  }

  return (
    <article
      aria-current={selected ? "true" : undefined}
      className={`demand-row demand-row--${context}${sessionOnItem ? " is-running" : ""}${selected ? " is-selected" : ""}${level > 0 ? " is-child" : ""}${expanded ? " is-expanded" : ""}`}
      onClick={(event) => openUnlessControl(event.target)}
    >
      <div
        className="demand-row__title"
        style={{ "--demand-level": level } as CSSProperties}
      >
        {treeLines.map((continues, index) => {
          const isElbow = index === treeLines.length - 1;
          return (
            <span
              aria-hidden="true"
              className={
                isElbow
                  ? `demand-row__elbow${continues ? "" : " is-last"}`
                  : `demand-row__rail${continues ? " is-continue" : ""}`
              }
              key={index}
              style={{ "--demand-line-index": index } as CSSProperties}
            />
          );
        })}
        {childCount > 0 ? (
          <span className="demand-row__toggle-slot">
            <button
              aria-expanded={expanded}
              aria-label={`${expanded ? "Recolher" : "Mostrar"} ${childCount === 1 ? "1 subdemanda" : `${childCount} subdemandas`} de ${title}`}
              className="demand-row__toggle"
              onClick={(event) => {
                event.stopPropagation();
                onToggle?.();
              }}
              type="button"
            >
              <span aria-hidden="true">{expanded ? "⌄" : "›"}</span>
              <span className="sr-only">
                {childCount === 1 ? "1 filho" : `${childCount} filhos`}
              </span>
            </button>
          </span>
        ) : level === 0 ? (
          <span aria-hidden="true" className="demand-row__toggle-slot" />
        ) : null}
        <button
          aria-label={`Abrir ${title}`}
          className="demand-row__title-button"
          onClick={() => onOpen(demand.id)}
          title={title}
          type="button"
        >
          <span className="demand-row__title-copy">
            {ancestorContext ? (
              <span
                className="demand-row__ancestor-context"
                title={ancestorContext}
              >
                {ancestorContext} /
              </span>
            ) : null}
            {demand.externalIdentifier ? (
              <span className="demand-row__identifier">
                {demand.externalIdentifier}
              </span>
            ) : null}
            <strong>{demand.title}</strong>
            {childCount > 0 ? (
              <small
                className="demand-row__child-count"
                title={
                  showChildProgress
                    ? `${completedChildCount} de ${childCount} subdemandas concluídas`
                    : `${childCount} ${childCount === 1 ? "subdemanda" : "subdemandas"}`
                }
              >
                {showChildProgress
                  ? `${completedChildCount}/${childCount}`
                  : childCount}
              </small>
            ) : null}
          </span>
        </button>
      </div>
      {context === "workspace" ? (
        <div className="demand-row__project">
          <Link
            href={`/w/${slug}/projects/${demand.projectId}`}
            title={demand.projectName}
          >
            {demand.projectName}
          </Link>
        </div>
      ) : null}
      <DemandStatus status={demand.status} />
      <div className="demand-row__metric demand-row__tracked">
        <span>{tracked}</span>
        {context === "workspace" &&
        demand.trackedSeconds > 0 &&
        demand.recordCount > 0 ? (
          <small className="demand-row__count">
            {demand.recordCount === 1
              ? "1 registro"
              : `${demand.recordCount} registros`}
          </small>
        ) : null}
        <small className="demand-row__metric-label"> registrado</small>
      </div>
      <div className="demand-row__metric demand-row__estimate">
        <span>{estimate}</span>
        <small className="demand-row__metric-label"> estimado</small>
      </div>
      {context === "workspace" ? (
        <time
          className="demand-row__updated"
          dateTime={demand.lastActivityAt?.toISOString()}
          title={updated.title}
        >
          {updated.label}
        </time>
      ) : null}
      <div className="demand-row__actions">
        {canManage && demand.source === "MANUAL" && onCreateChild ? (
          <button
            aria-label={`Adicionar subdemanda em ${title}`}
            className="button button--ghost button--icon button--sm demand-row__add-child"
            onClick={onCreateChild}
            title="Adicionar subdemanda"
            type="button"
          >
            <span aria-hidden="true">+</span>
          </button>
        ) : null}
        {canStart ? (
          <StartTimerButton
            compact
            projectId={demand.projectId}
            projectName={demand.projectName}
            workItemBreadcrumb={demand.workItemBreadcrumb}
            slug={slug}
            workItemId={demand.id}
            workItemIdentifier={demand.externalIdentifier}
            workItemTitle={demand.title}
          />
        ) : null}
        {context === "workspace" && canManage && projects ? (
          <DemandActionsMenu
            canManage={canManage}
            demand={demand}
            projects={projects}
            slug={slug}
            {...(onChanged ? { onChanged } : {})}
            {...(onEdit ? { onEdit } : {})}
            {...(onFeedback ? { onFeedback } : {})}
          />
        ) : null}
        {context === "project" ? (
          <span aria-hidden="true" className="demand-row__go">
            →
          </span>
        ) : null}
      </div>
    </article>
  );
}
