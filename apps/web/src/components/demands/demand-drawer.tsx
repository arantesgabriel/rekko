"use client";

import Link from "next/link";
import { useState } from "react";

import { DemandActionsMenu } from "@/components/demands/demand-actions-menu";
import { DemandForm } from "@/components/projects/new-demand-form";
import { Drawer } from "@/components/ui/drawer";
import { formatEstimate, workItemStatusLabel } from "@/modules/projects/domain";
import type {
  DemandListItem,
  DemandProjectOption,
} from "@/modules/projects/service";

function formatDuration(seconds: number) {
  const minutes = Math.floor(Math.max(seconds, 0) / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return (
    [hours ? `${hours}h` : "", rest ? `${rest}m` : ""]
      .filter(Boolean)
      .join(" ") || "0m"
  );
}

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
  const identifier = demand?.externalIdentifier ?? "Demanda";
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
      eyebrow={isCreate ? "Trabalho operacional" : identifier}
      onClose={requestClose}
      open={open}
      title={title}
      {...(!isCreate && !editing && canManage && demand.source === "MANUAL"
        ? {
            footer: (
              <button
                className="button button--primary"
                onClick={beginEditing}
                type="button"
              >
                Editar demanda
              </button>
            ),
          }
        : {})}
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
            <span
              className={`demand-status demand-status--${demand.status.toLowerCase()}`}
            >
              <span aria-hidden="true" />
              {workItemStatusLabel[demand.status]}
            </span>
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
          </div>
          <div className="demand-drawer__context">
            <span className="drawer-label">Projeto</span>
            <Link href={`/w/${slug}/projects/${demand.projectId}`}>
              {demand.projectName} <span aria-hidden="true">→</span>
            </Link>
            <span className="drawer-meta">
              {demand.source === "LINEAR" ? "Linear" : "Manual"}
            </span>
          </div>
          <dl className="demand-drawer__facts">
            <div>
              <dt>Estimativa</dt>
              <dd>{formatEstimate(demand.estimatedMinutes)}</dd>
            </div>
            <div>
              <dt>Tempo registrado</dt>
              <dd>{formatDuration(demand.trackedSeconds)}</dd>
            </div>
            <div>
              <dt>Registros</dt>
              <dd>{demand.recordCount || "Nenhum"}</dd>
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
            className="demand-drawer__section"
            aria-labelledby="demand-records-title"
          >
            <div className="demand-drawer__section-heading">
              <h3 id="demand-records-title">Registros recentes</h3>
              <span>{demand.recordCount || "Nenhum"}</span>
            </div>
            {demand.recentRecords.length ? (
              <ol className="demand-records">
                {demand.recentRecords.map((record) => (
                  <li key={record.id}>
                    <div>
                      <strong>
                        {formatRecordDate(record.startedAt, timezone)}
                      </strong>
                      <span>
                        {formatRecordTime(record.startedAt, timezone)}
                        {record.endedAt
                          ? ` → ${formatRecordTime(record.endedAt, timezone)}`
                          : " · em andamento"}
                      </span>
                    </div>
                    <time>{formatDuration(record.durationSeconds)}</time>
                  </li>
                ))}
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
