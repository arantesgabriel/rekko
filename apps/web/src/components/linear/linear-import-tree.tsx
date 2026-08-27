"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LinearIssue } from "@/modules/integrations/linear/gateway";

export function LinearImportTree({
  action,
  existingProjectId,
  issues,
  projectNameRequired,
}: {
  action: (formData: FormData) => void | Promise<void>;
  existingProjectId?: string;
  issues: LinearIssue[];
  projectNameRequired?: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const children = useMemo(() => {
    const map = new Map<string, LinearIssue[]>();
    for (const issue of issues) {
      if (!issue.parentId) continue;
      map.set(issue.parentId, [...(map.get(issue.parentId) ?? []), issue]);
    }
    return map;
  }, [issues]);
  const roots = issues.filter(
    (issue) =>
      !issue.parentId || !issues.some((item) => item.id === issue.parentId),
  );

  function toggle(issue: LinearIssue, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(issue.id);
      else next.delete(issue.id);
      for (const child of children.get(issue.id) ?? []) {
        if (checked) next.add(child.id);
        else next.delete(child.id);
      }
      return next;
    });
  }

  return (
    <form action={action} className="linear-import">
      {existingProjectId ? (
        <input
          name="existingProjectId"
          type="hidden"
          value={existingProjectId}
        />
      ) : null}
      {projectNameRequired ? (
        <label className="field">
          <span>Nome do projeto</span>
          <input maxLength={120} name="projectName" required />
        </label>
      ) : null}
      <div className="linear-tree" role="tree" aria-label="Demandas do Linear">
        {roots.map((issue) => (
          <LinearRow
            childrenForIssue={children.get(issue.id) ?? []}
            issue={issue}
            key={issue.id}
            onToggle={toggle}
            selected={selected}
          />
        ))}
      </div>
      {issues.length === 0 ? (
        <p className="empty-inline">Nenhuma demanda ativa disponível.</p>
      ) : null}
      {[...selected].map((id) => (
        <input key={id} name="issueIds" type="hidden" value={id} />
      ))}
      <footer className="linear-import__footer">
        <strong>{selected.size} selecionados</strong>
        <div>
          <button
            className="button button--secondary"
            onClick={() => history.back()}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="button button--primary"
            disabled={selected.size === 0}
            type="submit"
          >
            Importar selecionados
          </button>
        </div>
      </footer>
    </form>
  );
}

function LinearRow({
  childrenForIssue,
  issue,
  onToggle,
  selected,
}: {
  childrenForIssue: LinearIssue[];
  issue: LinearIssue;
  onToggle: (issue: LinearIssue, checked: boolean) => void;
  selected: Set<string>;
}) {
  const checkbox = useRef<HTMLInputElement>(null);
  const selectedChildren = childrenForIssue.filter((child) =>
    selected.has(child.id),
  ).length;
  const indeterminate =
    selectedChildren > 0 && selectedChildren < childrenForIssue.length;
  useEffect(() => {
    if (checkbox.current) checkbox.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <div
      className={`linear-tree__branch${selected.has(issue.id) ? " is-selected" : ""}`}
      role="treeitem"
      aria-expanded={childrenForIssue.length ? true : undefined}
      aria-selected={selected.has(issue.id)}
    >
      <label className="linear-tree__row">
        <input
          checked={selected.has(issue.id)}
          onChange={(event) => onToggle(issue, event.currentTarget.checked)}
          ref={checkbox}
          type="checkbox"
        />
        <span className="linear-tree__identity">
          <strong>{issue.identifier}</strong>
          <span>{issue.title}</span>
        </span>
        <small>{issue.status.name}</small>
      </label>
      {childrenForIssue.length ? (
        <div className="linear-tree__children" role="group">
          {childrenForIssue.map((child) => (
            <LinearRow
              childrenForIssue={[]}
              issue={child}
              key={child.id}
              onToggle={onToggle}
              selected={selected}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
