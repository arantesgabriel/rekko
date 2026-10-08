"use client";

import { CompactCreateButton } from "@/components/ui/compact-create-button";

export function CreateDemandButton({ onClick }: { onClick: () => void }) {
  return <CompactCreateButton label="Nova demanda" onClick={onClick} />;
}
