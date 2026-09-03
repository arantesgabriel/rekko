"use client";

import Link from "next/link";
import { useState } from "react";

import { DemandActionsMenu } from "@/components/demands/demand-actions-menu";
import { DemandStatus } from "@/components/demands/demand-status";
import { DemandForm } from "@/components/projects/new-demand-form";
import { formatDuration } from "@/components/projects/project-format";
import { Drawer } from "@/components/ui/drawer";
import { formatEstimate } from "@/modules/projects/domain";
import type {
  DemandListItem,
  DemandProjectOption,
} from "@/modules/projects/service";

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
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
    hour12: false,
  }).format(date);
}

function recordDurationLabel(record: {
  durationSeconds: number;
  endedAt: Date | null;
}) {
  if (!record.endedAt) return "Em andamento";
  if (record.durationSeconds < 60) return null;
  return formatDuration(record.durationSeconds);
}

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
  const isCreate = !demand;

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
  const visibleRecords =
    demand?.recentRecords.filter(
      (record) => !record.endedAt || record.durationSeconds >= 60,
    ) ?? [];

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
          <dl className="demand-drawer__facts">
            <div>
              <dt>Registrado</dt>
              <dd>
                {demand.trackedSeconds >= 60
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
          <section
            aria-labelledby="demand-records-title"
            className="demand-drawer__section"
          >
            <h3 id="demand-records-title">Registros recentes</h3>
            {visibleRecords.length ? (
              <ol className="demand-records">
                {visibleRecords.map((record) => {
                  const duration = recordDurationLabel(record);
                  return (
                    <li key={record.id}>
                      <span>
                        {formatRecordDate(record.startedAt, timezone)}
                      </span>
                      <span>
                        {formatRecordTime(record.startedAt, timezone)}
                        {record.endedAt
                          ? ` → ${formatRecordTime(record.endedAt, timezone)}`
                          : " → agora"}
                      </span>
                      <time>{duration}</time>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="drawer-empty-copy">
                Ainda não há tempo registrado nesta demanda.
              </p>
            )}
          </section>
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
