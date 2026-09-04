"use client";

import Link from "next/link";
import { useState } from "react";

import { DemandActionsMenu } from "@/components/demands/demand-actions-menu";
import { DemandStatus } from "@/components/demands/demand-status";
import { DemandTimeRecords } from "@/components/demands/demand-time-records";
import { DemandForm } from "@/components/projects/new-demand-form";
import { formatDuration } from "@/components/projects/project-format";
import { Drawer } from "@/components/ui/drawer";
import { useOptionalActiveSession } from "@/components/time-tracking/active-session-provider";
import { formatEstimate } from "@/modules/projects/domain";
import type {
  DemandListItem,
  DemandProjectOption,
} from "@/modules/projects/service";

export function DemandDrawer({
  canManage,
  demand,
  initialProjectId,
  onClose,
  onChanged,
  onFeedback,
  open,
  parents = [],
  projects,
  slug,
  startInEdit = false,
  timezone,
}: {
  canManage: boolean;
  demand?: DemandListItem;
  initialProjectId?: string;
  onChanged?: () => void;
  onClose: () => void;
  onFeedback?: (message: string) => void;
  open: boolean;
  parents?: { id: string; title: string }[];
  projects: DemandProjectOption[];
  slug: string;
  startInEdit?: boolean;
  timezone: string;
}) {
  const [editing, setEditing] = useState(startInEdit);
  const [dirty, setDirty] = useState(false);
  const tracking = useOptionalActiveSession();
  const isCreate = !demand;
  const sessionOnDemand =
    demand && tracking?.session?.workItemId === demand.id
      ? tracking.session.status
      : null;

  if (!open) return null;
  const requestClose = () => {
    if (dirty && !window.confirm("Descartar alterações não salvas?")) return;
    setDirty(false);
    onClose();
  };
  const beginEditing = () => {
    setDirty(false);
    setEditing(true);
  };
  const title = isCreate
    ? "Nova demanda"
    : editing
      ? "Editar demanda"
      : demand.title;
  const projectId = initialProjectId ?? demand?.projectId;
  const formProjects = projectId
    ? projects.filter((project) => project.id === projectId)
    : projects;

  return (
    <Drawer
      {...(demand?.externalIdentifier && !isCreate && !editing
        ? { eyebrow: demand.externalIdentifier }
        : {})}
      headerActions={
        !isCreate && !editing && demand ? (
          <>
            {canManage && demand.source === "MANUAL" ? (
              <button
                className="button button--ghost button--sm"
                onClick={beginEditing}
                type="button"
              >
                Editar
              </button>
            ) : null}
            {canManage ? (
              <DemandActionsMenu
                canManage={canManage}
                demand={demand}
                onEdit={beginEditing}
                projects={projects}
                slug={slug}
                {...(onChanged ? { onChanged } : {})}
                {...(onFeedback ? { onFeedback } : {})}
              />
            ) : null}
          </>
        ) : undefined
      }
      onClose={requestClose}
      open={open}
      title={title}
    >
      {isCreate || editing ? (
        <>
          <p className="drawer__intro">
            {isCreate
              ? "Crie uma demanda para registrar o tempo no projeto certo."
              : "Atualize os detalhes da demanda sem sair do contexto do trabalho."}
          </p>
          <DemandForm
            drawer
            onCancel={requestClose}
            onDirtyChange={setDirty}
            onSuccess={() => {
              setDirty(false);
              setEditing(false);
              if (isCreate) onClose();
            }}
            parents={parents}
            projects={formProjects}
            slug={slug}
            {...(editing && demand ? { item: demand } : {})}
            {...(projectId ? { projectId } : {})}
          />
        </>
      ) : (
        <div className="demand-drawer__content">
          <div className="demand-drawer__topline">
            <Link href={`/w/${slug}/projects/${demand.projectId}`}>
              {demand.projectName}
            </Link>
            <span aria-hidden="true">·</span>
            <DemandStatus status={demand.status} />
          </div>
          {sessionOnDemand ? (
            <p className="demand-drawer__session">
              <span aria-hidden="true" className="timer-status-dot" />
              {sessionOnDemand === "PAUSED" ? "Pausado" : "Em andamento"}
            </p>
          ) : null}
          <dl className="demand-drawer__facts">
            <div>
              <dt>Registrado</dt>
              <dd>
                {demand.trackedSeconds > 0
                  ? formatDuration(demand.trackedSeconds)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Estimativa</dt>
              <dd>
                {demand.estimatedMinutes
                  ? formatEstimate(demand.estimatedMinutes)
                  : "—"}
              </dd>
            </div>
          </dl>
          {demand.parentWorkItemId ? (
            <p className="drawer-meta">
              Esta demanda faz parte de uma demanda principal.
            </p>
          ) : null}
          {demand.description ? (
            <section className="demand-drawer__section">
              <h3>Descrição</h3>
              <p className="demand-drawer__description">{demand.description}</p>
            </section>
          ) : null}
          <DemandTimeRecords
            demand={demand}
            slug={slug}
            timezone={timezone}
            {...(onChanged ? { onChanged } : {})}
            {...(onFeedback ? { onFeedback } : {})}
          />
          {demand.source === "LINEAR" && demand.externalUrl ? (
            <a
              className="button button--secondary demand-drawer__external"
              href={demand.externalUrl}
              rel="noreferrer"
              target="_blank"
            >
              Abrir no Linear
            </a>
          ) : null}
        </div>
      )}
    </Drawer>
  );
}
