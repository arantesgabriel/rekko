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
} from "@/modules/projects/service";

export function DemandsWorkspace({
  canManage,
  counts,
  demands,
  parentOptions,
  projectOptions,
  query,
  slug,
  timezone,
}: {
  canManage: boolean;
  counts: { all: number; active: number; done: number };
  demands: DemandListItem[];
  parentOptions: DemandParentOption[];
  projectOptions: DemandProjectOption[];
  query: DemandListQuery;
  slug: string;
  timezone: string;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editDemandId, setEditDemandId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const selected = demands.find((demand) => demand.id === selectedId);
  const selectedParents = selected
    ? parentOptions.filter((parent) => parent.projectId === selected.projectId)
    : [];
  const createParents = query.projectId
    ? parentOptions.filter((parent) => parent.projectId === query.projectId)
    : [];
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
  }, []);

  const emptyTitle = hasFilters
    ? "Nenhuma demanda encontrada."
    : "Nenhuma demanda ainda.";
  const emptyDescription = hasFilters
    ? query.search && query.status === "ALL" && !query.projectId
      ? "Ajuste os filtros ou crie uma nova demanda."
      : "Nenhuma demanda corresponde aos filtros selecionados."
    : "Crie sua primeira demanda para começar a registrar seu tempo.";

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
        <>
          {hasFilters ? (
            <DemandList
              canManage={canManage}
              context="workspace"
              counts={counts}
              demands={[]}
              onOpen={() => undefined}
              projects={projectOptions}
              query={query}
              slug={slug}
              timezone={timezone}
            />
          ) : null}
          <EmptyState
            actions={
              hasFilters || !canManage ? null : (
                <button
                  className="button button--primary"
                  onClick={() => setCreateOpen(true)}
                  type="button"
                >
                  + Nova demanda
                </button>
              )
            }
            description={emptyDescription}
            title={emptyTitle}
          />
        </>
      ) : (
        <DemandList
          canManage={canManage}
          context="workspace"
          counts={counts}
          demands={demands}
          onChanged={refresh}
          onEdit={(id) => openDemand(id, true)}
          onFeedback={showFeedback}
          onOpen={(id) => openDemand(id)}
          projects={projectOptions}
          query={query}
          slug={slug}
          timezone={timezone}
        />
      )}

      {feedback ? (
        <ActionToast message={feedback} onDismiss={dismissFeedback} />
      ) : null}

      <DemandDrawer
        key={`demand-${selectedId ?? "none"}-${editDemandId ?? "view"}-${selected ? "open" : "closed"}`}
        canManage={canManage}
        onChanged={refresh}
        onClose={closeDrawer}
        onFeedback={showFeedback}
        open={Boolean(selected)}
        parents={selectedParents}
        projects={projectOptions}
        slug={slug}
        startInEdit={Boolean(selected && editDemandId === selected.id)}
        timezone={timezone}
        {...(selected ? { demand: selected } : {})}
      />
      <DemandDrawer
        key={`demand-create-${createOpen ? "open" : "closed"}`}
        canManage={canManage}
        {...(query.projectId ? { initialProjectId: query.projectId } : {})}
        onClose={closeDrawer}
        onFeedback={showFeedback}
        open={createOpen}
        parents={createParents}
        projects={projectOptions}
        slug={slug}
        timezone={timezone}
      />
    </div>
  );
}
