"use client";

import { useState, useTransition } from "react";
import {
  acceptInvitationAction,
  type ActionState,
} from "@/modules/workspaces/actions";

export function AcceptInvitation({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState | null>(null);
  return (
    <>
      <button
        className="button button--primary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await acceptInvitationAction(token);
            if (result) setState(result);
          })
        }
        type="button"
      >
        {pending ? "Entrando no Workspace…" : "Aceitar convite"}
      </button>
      {state?.message && (
        <p
          className={`form-message form-message--${state.status}`}
          role="alert"
        >
          {state.message}
        </p>
      )}
    </>
  );
}
