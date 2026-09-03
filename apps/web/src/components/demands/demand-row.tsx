"use client";

import Link from "next/link";

import { DemandActionsMenu } from "@/components/demands/demand-actions-menu";
import { DemandStatus } from "@/components/demands/demand-status";
import {
  formatTracked,
  formatUpdated,
} from "@/components/projects/project-format";
import { StartTimerButton } from "@/components/time-tracking/timer-controls";
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
  activeTimerStatus,
  activeTimerWorkItemId,
  canManage,
  context,
  demand,
  hasActiveTimer,
  onEdit,
  onFeedback,
  onOpen,
  onChanged,
  projects,
  slug,
  timezone,
}: {
  activeTimerStatus?: "RUNNING" | "PAUSED" | null;
  activeTimerWorkItemId?: string | null;
  canManage?: boolean;
  context: "workspace" | "project";
  demand: DemandListItem;
  hasActiveTimer?: boolean;
  onChanged?: () => void;
  onEdit?: () => void;
  onFeedback?: (message: string) => void;
  onOpen: (demandId: string) => void;
  projects?: DemandProjectOption[];
  slug: string;
  timezone: string;
}) {
  const title = demandTitle(demand);
  const updated = formatUpdated(demand.lastActivityAt, timezone);
  const tracked = formatTracked(demand.trackedSeconds);
  const estimate = demand.estimatedMinutes
    ? formatEstimate(demand.estimatedMinutes)
    : "—";
  const sessionOnItem = activeTimerWorkItemId === demand.id;
  const canStart =
    context === "workspace" &&
    demand.projectStatus === "ACTIVE" &&
    demand.isActive &&
    demand.status !== "DONE";

  function openUnlessControl(target: EventTarget | null) {
    const node = target instanceof Element ? target : null;
    if (node?.closest("a, button, select, textarea, input, [role='menu']"))
      return;
    onOpen(demand.id);
  }

  return (
    <article
      className={`demand-row demand-row--${context}${demand.isRunning ? " is-running" : ""}`}
      onClick={(event) => openUnlessControl(event.target)}
    >
      <button
        aria-label={`Abrir ${title}`}
        className="demand-row__title"
        onClick={() => onOpen(demand.id)}
        title={title}
        type="button"
      >
        {demand.externalIdentifier ? (
          <span className="demand-row__identifier">
            {demand.externalIdentifier}
          </span>
        ) : null}
        <strong>{demand.title}</strong>
      </button>
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
        demand.trackedSeconds >= 60 &&
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
      {context === "workspace" ? (
        <div className="demand-row__actions">
          {canStart ? (
            <StartTimerButton
              activeOnItem={sessionOnItem}
              hasActiveTimer={Boolean(hasActiveTimer)}
              projectId={demand.projectId}
              sessionStatus={sessionOnItem ? (activeTimerStatus ?? null) : null}
              slug={slug}
              workItemId={demand.id}
            />
          ) : null}
          {canManage && projects ? (
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
        </div>
      ) : (
        <span aria-hidden="true" className="demand-row__go">
          →
        </span>
      )}
    </article>
  );
}
