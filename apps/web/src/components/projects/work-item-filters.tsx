"use client";

import { useRef } from "react";

export function WorkItemFilters({
  kind,
  query,
  status,
}: {
  kind: string;
  query: string;
  status: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const searchTimerRef = useRef<number | undefined>(undefined);

  function submit() {
    formRef.current?.requestSubmit();
  }

  return (
    <form className="work-filters" method="get" ref={formRef} role="search">
      <label>
        <span className="sr-only">Buscar demandas</span>
        <input
          defaultValue={query}
          name="q"
          onChange={() => {
            window.clearTimeout(searchTimerRef.current);
            searchTimerRef.current = window.setTimeout(submit, 350);
          }}
          placeholder="Buscar por título…"
          type="search"
        />
      </label>
      <label>
        <span className="sr-only">Filtrar por status</span>
        <select defaultValue={status} name="status" onChange={submit}>
          <option value="ALL">Todos os status</option>
          <option value="TODO">A fazer</option>
          <option value="IN_PROGRESS">Em andamento</option>
          <option value="DONE">Concluídas</option>
        </select>
      </label>
      <label>
        <span className="sr-only">Filtrar por hierarquia</span>
        <select defaultValue={kind} name="kind" onChange={submit}>
          <option value="ALL">Toda hierarquia</option>
          <option value="ROOT">Itens principais</option>
          <option value="SUB_ITEM">Sub-itens</option>
        </select>
      </label>
      <noscript>
        <button className="button button--secondary button--sm" type="submit">
          Aplicar
        </button>
      </noscript>
    </form>
  );
}
