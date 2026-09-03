"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

type GettingStartedProgress = {
  hasInvite: boolean;
  hasLinear: boolean;
  hasManualEntry: boolean;
  hasTrackedTask: boolean;
};

type ChecklistItem = {
  complete: boolean;
  href?: string;
  label: string;
};

export function GettingStarted({
  progress,
  slug,
}: {
  progress: GettingStartedProgress;
  slug: string;
}) {
  const storageKey = `rekko-getting-started-dismissed:${slug}`;
  const dismissed = useSyncExternalStore(
    (onChange) => {
      const handleChange = (event: Event) => {
        if (
          event.type === "storage" &&
          (event as StorageEvent).key !== storageKey
        )
          return;
        onChange();
      };
      window.addEventListener("storage", handleChange);
      window.addEventListener("rekko-getting-started-change", handleChange);
      return () => {
        window.removeEventListener("storage", handleChange);
        window.removeEventListener(
          "rekko-getting-started-change",
          handleChange,
        );
      };
    },
    () => window.localStorage.getItem(storageKey) === "true",
    () => false,
  );
  const items: ChecklistItem[] = [
    { complete: true, label: "Workspace criado" },
    {
      complete: progress.hasInvite,
      href: `/w/${slug}/members`,
      label: "Convidar seu time",
    },
    {
      complete: progress.hasLinear,
      href: `/w/${slug}/integrations`,
      label: "Conectar o Linear",
    },
    {
      complete: progress.hasTrackedTask,
      href: `/w/${slug}/work`,
      label: "Registrar sua primeira tarefa",
    },
    {
      complete: progress.hasManualEntry,
      href: `/w/${slug}`,
      label: "Reconstruir seu primeiro gap",
    },
  ];
  const completed = items.filter((item) => item.complete).length;
  const nextItem = items.find((item) => !item.complete);

  if (dismissed || completed === items.length) return null;

  return (
    <aside className="getting-started" aria-label="Configuração do Rekko">
      <div className="getting-started__copy">
        <strong>Complete a configuração do Rekko</strong>
        <span>
          {completed}/{items.length}
        </span>
      </div>
      <div
        className="getting-started__progress"
        aria-label={`${completed} de ${items.length} etapas concluídas`}
        role="progressbar"
        aria-valuemax={items.length}
        aria-valuemin={0}
        aria-valuenow={completed}
      >
        <span
          className="getting-started__progress-fill"
          style={{ width: `${(completed / items.length) * 100}%` }}
        />
      </div>
      {nextItem?.href ? (
        <Link className="getting-started__continue" href={nextItem.href}>
          Continuar <span aria-hidden="true">→</span>
        </Link>
      ) : null}
      <button
        aria-label="Dispensar configuração"
        className="getting-started__dismiss"
        onClick={() => {
          window.localStorage.setItem(storageKey, "true");
          window.dispatchEvent(new Event("rekko-getting-started-change"));
        }}
        type="button"
      >
        ×
      </button>
    </aside>
  );
}
