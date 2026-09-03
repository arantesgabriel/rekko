export const projectStatuses = ["ACTIVE", "COMPLETED"] as const;
export const workItemStatuses = ["TODO", "IN_PROGRESS", "DONE"] as const;

export function parseEstimate(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  const match = /^(?:(\d+)\s*h)?(?:\s*(\d+)\s*m)?$/.exec(normalized);
  if (!match || (!match[1] && !match[2])) return undefined;
  const minutes = Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0);
  return Number.isSafeInteger(minutes) && minutes > 0 && minutes <= 525_600
    ? minutes
    : undefined;
}

export function formatEstimate(minutes: number | null) {
  if (!minutes) return "Sem estimativa";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return [hours ? `${hours}h` : "", rest ? `${rest}m` : ""]
    .filter(Boolean)
    .join(" ");
}

export function createsParentCycle(
  itemId: string,
  parentId: string | null,
  parentById: ReadonlyMap<string, string | null>,
) {
  const visited = new Set<string>([itemId]);
  let cursor = parentId;
  while (cursor) {
    if (visited.has(cursor)) return true;
    visited.add(cursor);
    cursor = parentById.get(cursor) ?? null;
  }
  return false;
}

export const projectStatusLabel = {
  ACTIVE: "Ativo",
  COMPLETED: "Concluído",
} as const;

export const workItemStatusLabel = {
  TODO: "A fazer",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluída",
} as const;

export function demandStatusLabel(status: (typeof workItemStatuses)[number]) {
  return status === "DONE" ? "Concluída" : "Ativa";
}
