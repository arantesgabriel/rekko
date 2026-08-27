export type EstimateParseResult =
  | { found: true; minutes: number; rawValue: string }
  | { found: false; minutes: null; rawValue: null };

const ESTIMATE_BLOCK =
  /(?:^|\n)\s*estimativa\s*\n+\s*(\d+\s*h(?:\s*\d+\s*m?)?|\d+\s*m)\.?\s*(?=\n|$)/giu;

export function parseEstimateFromDescription(
  description: string | null | undefined,
): EstimateParseResult {
  if (!description) return notFound();
  const matches = [...description.matchAll(ESTIMATE_BLOCK)];
  if (matches.length !== 1) return notFound();
  const rawValue = matches[0]?.[1]?.trim();
  if (!rawValue) return notFound();
  const compact = rawValue.toLowerCase().replace(/\s+/g, "");
  const hours = compact.match(/^(\d+)h(?:(\d+)m?)?$/);
  const minutesOnly = compact.match(/^(\d+)m$/);
  const minutes = hours
    ? Number(hours[1]) * 60 + Number(hours[2] ?? 0)
    : minutesOnly
      ? Number(minutesOnly[1])
      : 0;
  if (!Number.isSafeInteger(minutes) || minutes <= 0) return notFound();
  return { found: true, minutes, rawValue };
}

function notFound(): EstimateParseResult {
  return { found: false, minutes: null, rawValue: null };
}
