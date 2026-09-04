"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  demandSearchString,
  type DemandListQuery,
} from "@/components/demands/demand-query";
import {
  defaultDemandSort,
  type DemandSortDir,
  type DemandSortKey,
} from "@/modules/projects/demand-sort";

type Option = {
  label: string;
  status?: DemandListQuery["status"];
  sort?: DemandSortKey;
  dir?: DemandSortDir;
};

export function DemandColumnMenu({
  align = "start",
  label,
  options,
  query,
}: {
  align?: "start" | "end";
  label: string;
  options: Option[];
  query: DemandListQuery;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const active = options[0]?.status
    ? query.status !== "ALL"
    : options.some((option) => option.sort === query.sort) &&
      (query.sort !== defaultDemandSort.sort ||
        query.dir !== defaultDemandSort.dir);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      className={`demand-col-menu${align === "end" ? " demand-col-menu--end" : ""}`}
      ref={rootRef}
    >
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={
          options[0]?.status ? `Filtrar ${label}` : `Ordenar ${label}`
        }
        className={`demand-col-menu__trigger${active ? " is-active" : ""}`}
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        type="button"
      >
        {label}
        <span aria-hidden="true" className="demand-col-menu__caret" />
      </button>
      {open ? (
        <div
          aria-busy={pending}
          className="demand-col-menu__panel"
          id={menuId}
          role="menu"
        >
          {options.map((option) => {
            const selected = isSelected(option, query);
            return (
              <button
                aria-checked={selected}
                className={selected ? "is-selected" : undefined}
                key={option.label}
                onClick={() => {
                  const next: DemandListQuery = {
                    ...query,
                    ...(option.status ? { status: option.status } : {}),
                    ...(option.sort ? { sort: option.sort } : {}),
                    ...(option.dir ? { dir: option.dir } : {}),
                  };
                  startTransition(() => {
                    router.replace(`${pathname}${demandSearchString(next)}`, {
                      scroll: false,
                    });
                  });
                  setOpen(false);
                }}
                role="menuitemradio"
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function isSelected(option: Option, query: DemandListQuery) {
  if (option.status) return query.status === option.status;
  return option.sort === query.sort && option.dir === query.dir;
}
