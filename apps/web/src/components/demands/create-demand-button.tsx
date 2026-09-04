"use client";

import { CompactCreateButton } from "@/components/ui/compact-create-button";

export function CreateDemandButton({ onClick }: { onClick: () => void }) {
  return (
    <CompactCreateButton
      buttonClassName="demands-create-button"
      label="Nova demanda"
      labelClassName="demands-create-button__label"
      onClick={onClick}
    />
  );
}
