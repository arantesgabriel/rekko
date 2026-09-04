"use client";

import { Drawer } from "@/components/ui/drawer";
import { ProjectForm } from "@/components/projects/project-form";
import type { ProjectListItem } from "@/modules/projects/service";
import { useState } from "react";

type ProjectValues = Pick<
  ProjectListItem,
  "id" | "name" | "description" | "status" | "estimatedMinutes"
>;

export function ProjectDrawer({
  onClose,
  open,
  project,
  slug,
}: {
  onClose: () => void;
  open: boolean;
  project?: ProjectValues;
  slug: string;
}) {
  const editing = Boolean(project);
  const [dirty, setDirty] = useState(false);

  const requestClose = () => {
    if (dirty && !window.confirm("Descartar alterações não salvas?")) return;
    setDirty(false);
    onClose();
  };

  const handleSuccess = () => {
    setDirty(false);
    onClose();
  };

  return (
    <Drawer
      eyebrow={editing ? "Projeto" : "Novo projeto"}
      onClose={requestClose}
      open={open}
      title={editing ? "Editar projeto" : "Criar projeto"}
    >
      <p className="drawer__intro">
        {editing
          ? "Ajuste o contexto que organiza suas demandas."
          : "Crie um contexto para organizar demandas e entender onde seu tempo foi investido."}
      </p>
      <ProjectForm
        drawer
        onCancel={requestClose}
        onDirtyChange={setDirty}
        onSuccess={handleSuccess}
        slug={slug}
        {...(project ? { project } : {})}
      />
    </Drawer>
  );
}
