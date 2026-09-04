export function durationSeconds(
  segments: readonly { startedAt: Date; endedAt: Date | null }[],
  now: Date,
) {
  return segments.reduce((total, segment) => {
    const end = segment.endedAt ?? now;
    return (
      total +
      Math.max(
        0,
        Math.floor((end.getTime() - segment.startedAt.getTime()) / 1000),
      )
    );
  }, 0);
}

export function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return [hours, minutes, seconds % 60]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export function formatSavedDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  if (seconds < 60) return `${seconds}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return [hours ? `${hours}h` : "", minutes ? `${minutes}m` : ""]
    .filter(Boolean)
    .join(" ");
}

export function liveElapsedSeconds(session: {
  status: "RUNNING" | "PAUSED";
  accumulatedSeconds: number;
  openSegmentStartedAt: string | null;
  nowMs: number;
}) {
  if (session.status !== "RUNNING" || !session.openSegmentStartedAt) {
    return session.accumulatedSeconds;
  }
  return (
    session.accumulatedSeconds +
    Math.max(
      0,
      Math.floor(
        (session.nowMs - Date.parse(session.openSegmentStartedAt)) / 1000,
      ),
    )
  );
}
