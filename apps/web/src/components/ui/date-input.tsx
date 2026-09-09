"use client";

import { useEffect, useRef, useState } from "react";

import { formatDateInput, parseDateInput } from "@/modules/timeline/domain";

export function DateInput({
  name,
  onChange,
  value,
}: {
  name: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const [draft, setDraft] = useState(() => formatDateInput(value));
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (value === lastValueRef.current) return;
    lastValueRef.current = value;
    setDraft(formatDateInput(value));
  }, [value]);

  return (
    <>
      <input
        aria-invalid={draft.length > 0 && !parseDateInput(draft)}
        autoComplete="off"
        inputMode="numeric"
        maxLength={10}
        onChange={(event) => {
          const nextDraft = formatDateDraft(event.currentTarget.value);
          const nextValue = parseDateInput(nextDraft) ?? "";
          lastValueRef.current = nextValue;
          setDraft(nextDraft);
          onChange(nextValue);
        }}
        placeholder="dd/mm/aaaa"
        required
        type="text"
        value={draft}
      />
      <input name={name} type="hidden" value={value} />
    </>
  );
}

function formatDateDraft(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return formatDateInput(value);
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
