"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/modules/auth/auth-client";

export function SessionActions() {
  const router = useRouter();
  const [loading, setLoading] = useState<"all" | "current" | null>(null);
  async function signOut(all: boolean) {
    setLoading(all ? "all" : "current");
    try {
      if (all) {
        await authClient.revokeSessions();
        await authClient.signOut();
      } else await authClient.signOut();
    } finally {
      router.push("/login");
      router.refresh();
    }
  }
  return (
    <div className="session-actions">
      <button
        className="button button--secondary"
        disabled={Boolean(loading)}
        onClick={() => signOut(false)}
        type="button"
      >
        {loading === "current" ? "Saindo…" : "Sair"}
      </button>
      <button
        className="button button--ghost"
        disabled={Boolean(loading)}
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
