"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { CreateDemandButton } from "@/components/demands/create-demand-button";
import type { DemandListQuery } from "@/components/demands/demand-query";
import { DemandDrawer } from "@/components/demands/demand-drawer";
import { DemandFilters } from "@/components/demands/demand-filters";
import { DemandList } from "@/components/demands/demand-list";
import { ActionToast } from "@/components/ui/action-toast";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageToolbar } from "@/components/ui/page-toolbar";
import type {
  DemandListItem,
  DemandParentOption,
  DemandProjectOption,
  DemandRelationItem,
} from "@/modules/projects/service";

export function DemandsWorkspace({
  canManage,
  counts,
  demands,
  initialDemandId,
  parentOptions,
  projectOptions,
  query,
  relations,
  slug,
  timezone,
  userTimezone,
}: {
  canManage: boolean;
  counts: { all: number; active: number; done: number };
  demands: DemandListItem[];
  initialDemandId?: string;
  parentOptions: DemandParentOption[];
  projectOptions: DemandProjectOption[];
  query: DemandListQuery;
  relations: DemandRelationItem[];
  slug: string;
  timezone: string;
  userTimezone: string;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(
    initialDemandId ?? null,
  );
  const [editDemandId, setEditDemandId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [quickCreateParentId, setQuickCreateParentId] = useState<string | null>(
    null,
  );
  const [feedback, setFeedback] = useState("");
  const selected =
    demands.find((demand) => demand.id === selectedId) ??
    relations.find((demand) => demand.id === selectedId);
  const selectedParents = selected
    ? parentOptions.filter((parent) => parent.projectId === selected.projectId)
    : [];
  const selectedParent = selected?.parentWorkItemId
    ? relations.find((item) => item.id === selected.parentWorkItemId)
    : undefined;
  const selectedChildren = selected
    ? relations.filter((item) => item.parentWorkItemId === selected.id)
    : [];
  const createParents = parentOptions;
  const hasFilters = Boolean(
    query.search ||
    query.projectId ||
    query.status !== "ALL" ||
    query.sort !== "updated" ||
    query.dir !== "desc",
  );

  const closeDrawer = useCallback(() => {
    setSelectedId(null);
    setEditDemandId(null);
    setCreateOpen(false);
    setQuickCreateParentId(null);
  }, []);
  const refresh = useCallback(() => router.refresh(), [router]);
  const dismissFeedback = useCallback(() => setFeedback(""), []);
  const showFeedback = useCallback(
    (message: string) => setFeedback(message),
    [],
  );
  const openDemand = useCallback((id: string, edit = false) => {
    setCreateOpen(false);
    setEditDemandId(edit ? id : null);
    setSelectedId(id);
    setQuickCreateParentId(null);
  }, []);

  const searchOnly =
    Boolean(query.search) && query.status === "ALL" && !query.projectId;
  const emptyTitle = hasFilters
    ? searchOnly
      ? `Nenhuma demanda encontrada para “${query.search.trim()}”.`
      : "Nenhuma demanda corresponde aos filtros aplicados."
    : "Nenhuma demanda por aqui ainda.";
  const emptyDescription = hasFilters
    ? searchOnly
      ? "Tente outro termo ou limpe a busca para ver a árvore completa."
      : "Ajuste os filtros ou limpe-os para ver outras demandas."
    : "Crie sua primeira demanda para começar a organizar e registrar seu tempo.";

  return (
    <div className="demands-page">
      <PageHeader
        actions={
          canManage ? (
            <CreateDemandButton
              onClick={() => {
                setSelectedId(null);
                setEditDemandId(null);
                setCreateOpen(true);
              }}
            />
          ) : undefined
        }
        description="Organize e acompanhe os itens nos quais seu tempo é registrado."
        title="Demandas"
      />

      <PageToolbar label="Busca e filtros">
        <DemandFilters
          counts={counts}
          initialDir={query.dir}
          initialProjectId={query.projectId}
          initialQuery={query.search}
          initialSort={query.sort}
          initialStatus={query.status}
          key={`${query.search}:${query.status}:${query.projectId}:${query.sort}:${query.dir}`}
          projects={projectOptions}
        />
      </PageToolbar>

      {demands.length === 0 ? (
        <EmptyState
          actions={
            hasFilters ? (
              <button
                className="button button--ghost"
                onClick={() =>
                  router.replace(`/w/${slug}/work`, { scroll: false })
                }
                type="button"
              >
                Limpar filtros
              </button>
            ) : canManage ? (
              <button
                className="button button--primary"
                onClick={() => setCreateOpen(true)}
                type="button"
              >
                + Nova demanda
              </button>
            ) : null
          }
          description={emptyDescription}
          title={emptyTitle}
        />
      ) : (
        <DemandList
          canManage={canManage}
          catalog={relations}
          context="workspace"
          counts={counts}
          demands={demands}
          onChanged={refresh}
          onEdit={(id) => openDemand(id, true)}
          onFeedback={showFeedback}
          onCreateChild={(id) => {
            setCreateOpen(false);
            setEditDemandId(null);
            setSelectedId(id);
            setQuickCreateParentId(id);
          }}
          onOpen={(id) => openDemand(id)}
          projects={projectOptions}
          query={query}
          slug={slug}
          timezone={timezone}
          selectedId={selectedId}
        />
      )}

      {feedback ? (
        <ActionToast message={feedback} onDismiss={dismissFeedback} />
      ) : null}

      <DemandDrawer
        key={
          quickCreateParentId
            ? `quick-${quickCreateParentId}`
            : editDemandId
              ? `edit-${editDemandId}`
              : "demand-detail"
        }
        canManage={canManage}
        onChanged={refresh}
        onClose={closeDrawer}
        onCreated={(demandId) => {
          setEditDemandId(null);
          setSelectedId(demandId);
        }}
        onFeedback={showFeedback}
        onNavigate={(id) => openDemand(id)}
        open={Boolean(selected)}
        parents={selectedParents}
        projects={projectOptions}
        subdemands={selectedChildren}
        slug={slug}
        startInEdit={Boolean(selected && editDemandId === selected.id)}
        startCreatingChild={Boolean(
          selected && quickCreateParentId === selected.id,
        )}
        timezone={timezone}
        userTimezone={userTimezone}
        {...(selectedParent ? { parentDemand: selectedParent } : {})}
        {...(selected ? { demand: selected } : {})}
      />
      <DemandDrawer
        key={`demand-create-${createOpen ? "open" : "closed"}`}
        canManage={canManage}
        {...(query.projectId ? { initialProjectId: query.projectId } : {})}
        onClose={closeDrawer}
        onCreated={(demandId) => {
          setCreateOpen(false);
          setSelectedId(null);
          refresh();
          if (demandId) showFeedback("Demanda criada.");
        }}
        onFeedback={showFeedback}
        open={createOpen}
        parents={createParents}
        projects={projectOptions}
        slug={slug}
        timezone={timezone}
        userTimezone={userTimezone}
      />
    </div>
  );
}
