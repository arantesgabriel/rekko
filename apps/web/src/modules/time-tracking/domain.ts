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
