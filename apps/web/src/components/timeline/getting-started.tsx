"use client";

import { useState, useSyncExternalStore } from "react";
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
      href: `/w/${slug}#timeline-title`,
      label: "Reconstruir seu primeiro gap",
    },
  ];
  const completed = items.filter((item) => item.complete).length;
  const [collapsed, setCollapsed] = useState(completed >= 3);

  if (dismissed || completed === items.length) return null;

  return (
    <section
      className="getting-started"
      aria-labelledby="getting-started-title"
    >
      <div className="getting-started__heading">
        <div>
          <h2 id="getting-started-title">Primeiros passos</h2>
          <p className="getting-started__summary">
            {completed} de {items.length} concluídos
          </p>
        </div>
        <div className="getting-started__actions">
          <button
            aria-controls="getting-started-items"
            aria-expanded={!collapsed}
            className="button button--ghost button--sm"
            onClick={() => setCollapsed((value) => !value)}
            type="button"
          >
            {collapsed ? "Mostrar" : "Recolher"}
          </button>
          <button
            aria-label="Dispensar primeiros passos"
            className="button button--ghost button--sm"
            onClick={() => {
              window.localStorage.setItem(storageKey, "true");
              window.dispatchEvent(new Event("rekko-getting-started-change"));
            }}
            type="button"
          >
            Dispensar
          </button>
        </div>
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
      <ul hidden={collapsed} id="getting-started-items">
        {items.map((item) => (
          <li
            className={item.complete ? "is-complete" : undefined}
            key={item.label}
          >
            <span aria-hidden="true">{item.complete ? "✓" : "○"}</span>
            {item.href && !item.complete ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
