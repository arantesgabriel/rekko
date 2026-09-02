"use client";
import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/modules/auth/auth-client";

export function SessionActions({
  variant = "default",
}: {
  variant?: "default" | "verification";
}) {
  const router = useRouter();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [loading, setLoading] = useState<"all" | "current" | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function signOut(all: boolean) {
    setLoading(all ? "all" : "current");
    setError(null);
    try {
      if (all) {
        const result = await authClient.revokeSessions();
        if (result.error) throw new Error("Unable to revoke sessions");
        await authClient.signOut();
      } else await authClient.signOut();
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Não conseguimos encerrar a sessão agora. Tente novamente.");
    } finally {
      setLoading(null);
    }
  }

  if (variant === "verification") {
    return (
      <div className="session-actions session-actions--verification">
        {error ? <p role="alert">{error}</p> : null}
        <button
          className="button button--ghost"
          disabled={!mounted || Boolean(loading)}
          onClick={() => signOut(false)}
          type="button"
        >
          {loading === "current" ? "Saindo…" : "Usar outra conta"}
        </button>
        <details className="session-actions__more">
          <summary>Mais opções de sessão</summary>
          <button
            className="button button--ghost"
            disabled={!mounted || Boolean(loading)}
            onClick={() => signOut(true)}
            type="button"
          >
            {loading === "all"
              ? "Encerrando sessões…"
              : "Sair de todos os dispositivos"}
          </button>
        </details>
      </div>
    );
  }

  return (
    <div className="session-actions">
      {error ? <p role="alert">{error}</p> : null}
      <button
        className="button button--secondary"
        disabled={!mounted || Boolean(loading)}
        onClick={() => signOut(false)}
        type="button"
      >
        {loading === "current" ? "Saindo…" : "Sair"}
      </button>
      <button
        className="button button--ghost"
        disabled={!mounted || Boolean(loading)}
        onClick={() => signOut(true)}
        type="button"
      >
        {loading === "all"
          ? "Encerrando sessões…"
          : "Sair de todos os dispositivos"}
      </button>
    </div>
  );
}
