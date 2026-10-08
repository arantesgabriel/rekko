"use client";

import Link from "next/link";
import type { CSSProperties, KeyboardEvent } from "react";

import { DemandActionsMenu } from "@/components/demands/demand-actions-menu";
import { DemandStatus } from "@/components/demands/demand-status";
import {
  formatTracked,
  formatUpdated,
} from "@/components/projects/project-format";
import { StartTimerButton } from "@/components/time-tracking/timer-controls";
import { useOptionalActiveSession } from "@/components/time-tracking/active-session-provider";
import { formatEstimate } from "@/modules/projects/domain";
import type { DemandTreeItem } from "@/modules/projects/demand-tree";
import type { DemandProjectOption } from "@/modules/projects/service";

function demandTitle(demand: DemandTreeItem) {
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
  onToggle,
  onCreateChild,
  selected = false,
}: {
  canManage?: boolean;
  context: "workspace" | "project";
  demand: DemandTreeItem;
  onChanged?: () => void;
  onEdit?: () => void;
  onFeedback?: (message: string) => void;
  onOpen: (demandId: string) => void;
  projects?: DemandProjectOption[];
  slug: string;
  timezone: string;
  onToggle?: () => void;
  onCreateChild?: () => void;
  selected?: boolean;
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
  const orphanContext =
    demand.depth === 0 && demand.parentWorkItemId && demand.workItemBreadcrumb
      ? demand.workItemBreadcrumb.split(" / ").slice(0, -1).join(" / ")
      : "";
  const progressLabel =
    demand.childCount > 0
      ? `${demand.completedChildCount}/${demand.childCount}`
      : "";

  function openUnlessControl(target: EventTarget | null) {
    const node = target instanceof Element ? target : null;
    if (node?.closest("a, button, select, textarea, input, [role='menu']"))
      return;
    onOpen(demand.id);
  }

  function handleTreeKeys(event: KeyboardEvent<HTMLElement>) {
    if (
      event.key === "ArrowRight" &&
      demand.hasChildren &&
      !demand.isExpanded
    ) {
      event.preventDefault();
      onToggle?.();
      return;
    }
    if (event.key === "ArrowLeft" && demand.hasChildren && demand.isExpanded) {
      event.preventDefault();
      onToggle?.();
    }
  }

  return (
    <article
      aria-current={selected ? "true" : undefined}
      className={[
        "demand-row",
        `demand-row--${context}`,
        sessionOnItem ? "is-running" : "",
        selected ? "is-selected" : "",
        demand.depth > 0 ? "is-child" : "",
        demand.isExpanded ? "is-expanded" : "",
        demand.isContext ? "is-context" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={(event) => openUnlessControl(event.target)}
      onKeyDown={handleTreeKeys}
      style={{ "--tree-depth": demand.depth } as CSSProperties}
    >
      <div className="demand-row__title">
        <span aria-hidden="true" className="demand-tree-indent">
          {demand.treeLines.map((continues, index) => {
            const isBranch = index === demand.treeLines.length - 1;
            return (
              <span
                className={[
                  "demand-tree-guide",
                  continues ? "is-continue" : "",
                  isBranch ? "is-branch" : "",
                  isBranch && !continues ? "is-last" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={index}
              />
            );
          })}
        </span>
        <span className="demand-row__toggle-slot">
          {demand.hasChildren ? (
            <button
              aria-expanded={demand.isExpanded}
              aria-label={`${demand.isExpanded ? "Recolher" : "Mostrar"} ${demand.childCount === 1 ? "1 subdemanda" : `${demand.childCount} subdemandas`} de ${title}`}
              className="demand-row__toggle"
              onClick={(event) => {
                event.stopPropagation();
                onToggle?.();
              }}
              onKeyDown={handleTreeKeys}
              type="button"
            >
              <svg aria-hidden="true" fill="none" viewBox="0 0 12 12">
                <path
                  d="M4.25 2.75 8.25 6l-4 3.25"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
          ) : null}
        </span>
        <button
          aria-label={title}
          className="demand-row__title-button"
          onClick={() => onOpen(demand.id)}
          onKeyDown={handleTreeKeys}
          title={title}
          type="button"
        >
          <span className="demand-row__title-copy">
            {orphanContext ? (
              <span
                className="demand-row__ancestor-context"
                title={orphanContext}
              >
                {orphanContext} /
              </span>
            ) : null}
            {demand.externalIdentifier ? (
              <span className="demand-row__identifier">
                {demand.externalIdentifier}
              </span>
            ) : null}
            <strong className="demand-row__name">{demand.title}</strong>
          </span>
        </button>
        {progressLabel ? (
          <small
            className="demand-row__child-count"
            title={`${demand.completedChildCount} de ${demand.childCount} ${demand.childCount === 1 ? "subdemanda" : "subdemandas"} concluídas`}
          >
            {progressLabel}
          </small>
        ) : null}
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
            {...(onCreateChild && demand.source === "MANUAL"
              ? { onCreateChild }
              : {})}
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
