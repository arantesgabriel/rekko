"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { formatDuration } from "@/modules/time-tracking/domain";

import {
  sessionDemandLabel,
  type ActiveSessionSnapshot,
  type StartSessionInput,
} from "./active-session-model";

export function SwitchSessionDialog({
  current,
  elapsedSeconds,
  errorMessage,
  next,
  onCancel,
  onConfirm,
  open,
  pending,
}: {
  current: ActiveSessionSnapshot | null;
  elapsedSeconds: number;
  errorMessage?: string;
  next: StartSessionInput | null;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  pending: boolean;
}) {
  if (!current || !next) return null;
  return (
    <ConfirmationDialog
      confirmLabel="Trocar"
      description={
        <span className="switch-session-copy">
          <span>
            <small>Atual</small>
            <strong>{sessionDemandLabel(current)}</strong>
            <span>{formatDuration(elapsedSeconds)}</span>
          </span>
          <span>
            <small>Próxima</small>
            <strong>
              {next.workItemIdentifier
                ? `${next.workItemIdentifier} · ${next.workItemTitle}`
                : next.workItemTitle}
            </strong>
            <span>{next.projectName}</span>
          </span>
        </span>
      }
      {...(errorMessage ? { errorMessage } : {})}
      onClose={onCancel}
      onConfirm={onConfirm}
      open={open}
      pending={pending}
      title="Trocar atividade?"
    />
  );
}
