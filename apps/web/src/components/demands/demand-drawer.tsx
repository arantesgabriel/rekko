"use client";

import Link from "next/link";
import { useState } from "react";

import { DemandActionsMenu } from "@/components/demands/demand-actions-menu";
import { DemandStatus } from "@/components/demands/demand-status";
import { DemandTimeRecords } from "@/components/demands/demand-time-records";
import { QuickSubdemandForm } from "@/components/demands/quick-subdemand-form";
import { DemandForm } from "@/components/projects/new-demand-form";
import { formatDuration } from "@/components/projects/project-format";
import { ManualTimeEntryDialog } from "@/components/timeline/manual-time-entry-dialog";
import { Drawer } from "@/components/ui/drawer";
import { useOptionalActiveSession } from "@/components/time-tracking/active-session-provider";
import { StartTimerButton } from "@/components/time-tracking/timer-controls";
import { formatEstimate } from "@/modules/projects/domain";
import type {
  DemandListItem,
  DemandProjectOption,
  DemandRelationItem,
} from "@/modules/projects/service";

export function DemandDrawer({
  canManage,
  demand,
  initialProjectId,
  onClose,
  onChanged,
  onCreated,
  onFeedback,
  onNavigate,
  open,
  parentDemand,
  parents = [],
  projects,
  slug,
  startInEdit = false,
  startCreatingChild = false,
  subdemands = [],
  timezone,
  userTimezone,
}: {
  canManage: boolean;
  demand?: DemandListItem;
  initialProjectId?: string;
  onChanged?: () => void;
  onCreated?: (demandId: string) => void;
  onClose: () => void;
  onFeedback?: (message: string) => void;
  onNavigate?: (demandId: string) => void;
  open: boolean;
  parentDemand?: DemandRelationItem;
  parents?: {
    id: string;
    title: string;
    projectId?: string;
    workItemBreadcrumb?: string | null | undefined;
  }[];
  projects: DemandProjectOption[];
  slug: string;
  startInEdit?: boolean;
  startCreatingChild?: boolean;
  subdemands?: DemandRelationItem[];
  timezone: string;
  userTimezone?: string;
}) {
  const [editing, setEditing] = useState(startInEdit);
  const [creatingChild, setCreatingChild] = useState(startCreatingChild);
  const [dirty, setDirty] = useState(false);
  const [timeEntryOpen, setTimeEntryOpen] = useState(false);
  const tracking = useOptionalActiveSession();
  const isCreate = !demand;
  const timeEntryTimezone = userTimezone ?? timezone;
  const sessionOnDemand =
    demand && tracking?.session?.workItemId === demand.id
      ? tracking.session.status
      : null;
  const canTrack = Boolean(
    demand &&
    demand.projectStatus === "ACTIVE" &&
    demand.isActive &&
    demand.status !== "DONE",
  );

  if (!open) return null;
  const requestClose = () => {
    if (dirty && !window.confirm("Descartar alterações não salvas?")) return;
    setDirty(false);
    setEditing(false);
    setTimeEntryOpen(false);
    setCreatingChild(false);
    onClose();
  };
  const beginEditing = () => {
    setDirty(false);
    setEditing(true);
  };
  const navigateTo = (demandId: string) => {
    setCreatingChild(false);
    setDirty(false);
    setEditing(false);
    onNavigate?.(demandId);
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
    <>
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
              onSuccess={(createdDemandId) => {
                setDirty(false);
                setEditing(false);
                if (isCreate) {
                  onClose();
                  if (createdDemandId) onCreated?.(createdDemandId);
                }
              }}
              parents={parents}
              projects={formProjects}
              slug={slug}
              {...(editing && demand ? { item: demand } : {})}
              {...(projectId ? { projectId } : {})}
            />
          </>
        ) : (
          <div className="demand-drawer__content" key={demand.id}>
            <div className="demand-drawer__topline">
              <Link href={`/w/${slug}/projects/${demand.projectId}`}>
                {demand.projectName}
              </Link>
              <span aria-hidden="true">·</span>
              <DemandStatus status={demand.status} />
            </div>
            {parentDemand ? (
              <div className="demand-drawer__parent-context">
                <span>Demanda pai</span>
                <button
                  onClick={() => navigateTo(parentDemand.id)}
                  type="button"
                >
                  <span aria-hidden="true">↑</span>
                  <span>
                    {parentDemand.externalIdentifier
                      ? `${parentDemand.externalIdentifier} · `
                      : ""}
                    {parentDemand.title}
                  </span>
                </button>
              </div>
            ) : null}
            {sessionOnDemand ? (
              <p className="demand-drawer__session">
                <span aria-hidden="true" className="timer-status-dot" />
                {sessionOnDemand === "PAUSED" ? "Pausado" : "Em andamento"}
              </p>
            ) : null}
            {canTrack ? (
              <div className="demand-drawer__time-actions">
                <StartTimerButton
                  projectId={demand.projectId}
                  projectName={demand.projectName}
                  slug={slug}
                  workItemId={demand.id}
                  workItemIdentifier={demand.externalIdentifier}
                  workItemTitle={demand.title}
                />
                <button
                  className="button button--secondary button--sm"
                  onClick={() => setTimeEntryOpen(true)}
                  type="button"
                >
                  Adicionar tempo
                </button>
              </div>
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
            <section className="demand-drawer__section demand-drawer__subdemands">
              <div className="demand-drawer__section-heading">
                <h3>Subdemandas</h3>
                <span title="Subdemandas concluídas">
                  {subdemands.length
                    ? `${subdemands.filter((item) => item.status === "DONE").length}/${subdemands.length}`
                    : "0"}
                </span>
              </div>
              {subdemands.length ? (
                <ul className="demand-drawer__subdemand-list">
                  {subdemands.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => navigateTo(item.id)}
                        title={item.title}
                        type="button"
                      >
                        <span
                          aria-hidden="true"
                          className={`demand-drawer__subdemand-mark demand-drawer__subdemand-mark--${item.status.toLowerCase()}`}
                        >
                          {item.status === "DONE" ? "✓" : ""}
                        </span>
                        <span className="demand-drawer__subdemand-title">
                          {item.externalIdentifier ? (
                            <small>{item.externalIdentifier}</small>
                          ) : null}
                          {item.title}
                        </span>
                        <span className="demand-drawer__subdemand-estimate">
                          {item.estimatedMinutes
                            ? formatEstimate(item.estimatedMinutes)
                            : "—"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="drawer-empty-copy">Nenhuma subdemanda.</p>
              )}
              {canManage && demand.source === "MANUAL" ? (
                creatingChild ? (
                  <QuickSubdemandForm
                    onCancel={() => setCreatingChild(false)}
                    onCreated={() => {
                      onFeedback?.("Subdemanda criada.");
                    }}
                    parentId={demand.id}
                    projectId={demand.projectId}
                    slug={slug}
                  />
                ) : (
                  <button
                    className="demand-drawer__add-subdemand"
                    onClick={() => setCreatingChild(true)}
                    type="button"
                  >
                    + Adicionar subdemanda
                  </button>
                )
              ) : null}
            </section>
            {demand.description ? (
              <section className="demand-drawer__section">
                <h3>Descrição</h3>
                <p className="demand-drawer__description">
                  {demand.description}
                </p>
              </section>
            ) : null}
            <DemandTimeRecords
              demand={demand}
              slug={slug}
              timezone={timeEntryTimezone}
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
      {demand && timeEntryOpen ? (
        <ManualTimeEntryDialog
          demand={demand}
          onClose={() => setTimeEntryOpen(false)}
          onSaved={(message) => {
            setTimeEntryOpen(false);
            onChanged?.();
            onFeedback?.(message);
          }}
          slug={slug}
          timezone={timeEntryTimezone}
        />
      ) : null}
    </>
  );
}
