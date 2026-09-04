"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
  finishTimerAction,
  pauseTimerAction,
  resumeTimerAction,
  startTimerAction,
  switchTimerAction,
  type TimerActionState,
} from "@/modules/time-tracking/actions";
import { formatSavedDuration } from "@/modules/time-tracking/domain";

import {
  sessionDemandLabel,
  type ActiveSessionSnapshot,
  type StartSessionInput,
  type TimerTarget,
} from "./active-session-model";

type Busy =
  "idle" | "starting" | "pausing" | "resuming" | "stopping" | "switching";

type ActiveSessionContextValue = {
  busy: Busy;
  error: string;
  session: ActiveSessionSnapshot | null;
  targets: TimerTarget[];
  timezone: string;
  toast: string | null;
  pendingSwitch: StartSessionInput | null;
  clearError: () => void;
  dismissToast: () => void;
  cancelSwitch: () => void;
  confirmSwitch: () => Promise<void>;
  finish: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  start: (input: StartSessionInput) => Promise<void>;
};

const ActiveSessionContext = createContext<ActiveSessionContextValue | null>(
  null,
);

const idleState: TimerActionState = { status: "idle", message: "" };

function optimisticRunning(
  input: StartSessionInput,
  id = `optimistic-${input.workItemId}`,
): ActiveSessionSnapshot {
  return {
    id,
    status: "RUNNING",
    projectId: input.projectId,
    projectName: input.projectName,
    workItemId: input.workItemId,
    workItemTitle: input.workItemTitle,
    workItemIdentifier: input.workItemIdentifier ?? null,
    accumulatedSeconds: 0,
    openSegmentStartedAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    workspaceSlug: input.slug,
  };
}

export function ActiveSessionProvider({
  children,
  initialSession,
  targets,
  timezone,
}: {
  children: ReactNode;
  initialSession: ActiveSessionSnapshot | null;
  targets: TimerTarget[];
  timezone: string;
}) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [busy, setBusy] = useState<Busy>("idle");
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [pendingSwitch, setPendingSwitch] = useState<StartSessionInput | null>(
    null,
  );
  const sessionRef = useRef(session);
  const ignoreUntilNull = useRef(false);
  const inFlight = useRef(false);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (ignoreUntilNull.current) {
      if (initialSession === null) ignoreUntilNull.current = false;
      else return;
    }
    setSession(initialSession);
  }, [initialSession]);

  const refresh = useCallback(() => router.refresh(), [router]);

  const run = useCallback(
    async (
      nextBusy: Busy,
      action: () => Promise<TimerActionState>,
      rollback: ActiveSessionSnapshot | null,
    ) => {
      if (inFlight.current) return idleState;
      inFlight.current = true;
      setBusy(nextBusy);
      setError("");
      try {
        const result = await action();
        if (result.status === "error") {
          setSession(rollback);
          setError(result.message);
        } else {
          refresh();
        }
        return result;
      } catch {
        setSession(rollback);
        setError("Não conseguimos atualizar a sessão. Tente novamente.");
        return idleState;
      } finally {
        inFlight.current = false;
        setBusy("idle");
      }
    },
    [refresh],
  );

  const start = useCallback(
    async (input: StartSessionInput) => {
      const current = sessionRef.current;
      if (current?.workItemId === input.workItemId) return;
      if (current) {
        setPendingSwitch(input);
        return;
      }
      const previous = current;
      setSession(optimisticRunning(input));
      await run(
        "starting",
        () =>
          startTimerAction(
            input.slug,
            input.projectId,
            input.workItemId,
            idleState,
          ),
        previous,
      );
    },
    [run],
  );

  const confirmSwitch = useCallback(async () => {
    const input = pendingSwitch;
    const current = sessionRef.current;
    if (!input || !current) return;
    const previous = current;
    const elapsed =
      current.status === "RUNNING" && current.openSegmentStartedAt
        ? current.accumulatedSeconds +
          Math.max(
            0,
            Math.floor(
              (Date.now() - Date.parse(current.openSegmentStartedAt)) / 1000,
            ),
          )
        : current.accumulatedSeconds;
    setPendingSwitch(null);
    setSession(optimisticRunning(input, current.id));
    const result = await run(
      "switching",
      () =>
        switchTimerAction(
          input.slug,
          input.projectId,
          input.workItemId,
          idleState,
        ),
      previous,
    );
    if (result.status === "error") return;
    setToast(
      `Registro salvo · ${sessionDemandLabel(previous)} · ${formatSavedDuration(elapsed)}`,
    );
  }, [pendingSwitch, run]);

  const pause = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || current.status !== "RUNNING") return;
    const previous = current;
    const now = new Date().toISOString();
    const extra = current.openSegmentStartedAt
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - Date.parse(current.openSegmentStartedAt)) / 1000,
          ),
        )
      : 0;
    setSession({
      ...current,
      status: "PAUSED",
      accumulatedSeconds: current.accumulatedSeconds + extra,
      openSegmentStartedAt: null,
    });
    await run("pausing", () => pauseTimerAction(idleState), previous);
    void now;
  }, [run]);

  const resume = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || current.status !== "PAUSED") return;
    const previous = current;
    setSession({
      ...current,
      status: "RUNNING",
      openSegmentStartedAt: new Date().toISOString(),
    });
    await run("resuming", () => resumeTimerAction(idleState), previous);
  }, [run]);

  const finish = useCallback(async () => {
    const current = sessionRef.current;
    if (!current) return;
    const previous = current;
    const elapsed =
      current.status === "RUNNING" && current.openSegmentStartedAt
        ? current.accumulatedSeconds +
          Math.max(
            0,
            Math.floor(
              (Date.now() - Date.parse(current.openSegmentStartedAt)) / 1000,
            ),
          )
        : current.accumulatedSeconds;
    ignoreUntilNull.current = true;
    setSession(null);
    const result = await run(
      "stopping",
      () => finishTimerAction(idleState),
      previous,
    );
    if (result.status === "error") {
      ignoreUntilNull.current = false;
      return;
    }
    setToast(
      `Registro salvo · ${sessionDemandLabel(previous)} · ${formatSavedDuration(elapsed)}`,
    );
  }, [run]);

  const value = useMemo<ActiveSessionContextValue>(
    () => ({
      busy,
      error,
      session,
      targets,
      timezone,
      toast,
      pendingSwitch,
      clearError: () => setError(""),
      dismissToast: () => setToast(null),
      cancelSwitch: () => setPendingSwitch(null),
      confirmSwitch,
      finish,
      pause,
      resume,
      start,
    }),
    [
      busy,
      confirmSwitch,
      error,
      finish,
      pause,
      pendingSwitch,
      resume,
      session,
      start,
      targets,
      timezone,
      toast,
    ],
  );

  return (
    <ActiveSessionContext.Provider value={value}>
      {children}
    </ActiveSessionContext.Provider>
  );
}

export function useActiveSession() {
  const context = useContext(ActiveSessionContext);
  if (!context) {
    throw new Error(
      "useActiveSession must be used within ActiveSessionProvider",
    );
  }
  return context;
}

export function useOptionalActiveSession() {
  return useContext(ActiveSessionContext);
}
