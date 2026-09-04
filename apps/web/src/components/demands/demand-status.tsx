import { demandStatusLabel } from "@/modules/projects/domain";

export function DemandStatus({
  status,
}: {
  status: "TODO" | "IN_PROGRESS" | "DONE";
}) {
  const label = demandStatusLabel(status);
  const tone = status === "DONE" ? "done" : "active";
  return (
    <span className={`demand-status demand-status--${tone}`}>
      <span aria-hidden="true" className="demand-status__dot" />
      <span className="demand-status__label">{label}</span>
    </span>
  );
}
