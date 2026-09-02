"use client";

import { useState } from "react";

export function ExportCsvButton({ href }: { href: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function exportCsv() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(href, { credentials: "same-origin" });
      if (!response.ok) throw new Error("export_failed");
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = filenameFrom(
        response.headers.get("content-disposition"),
      );
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch {
      setError("Não conseguimos gerar o CSV agora. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="reports-export">
      <button
        className="button button--primary"
        disabled={pending}
        onClick={exportCsv}
        type="button"
      >
        {pending ? "Exportando…" : "Exportar CSV"}
      </button>
      {error ? (
        <p className="form-message form-message--error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function filenameFrom(contentDisposition: string | null) {
  const match = contentDisposition?.match(/filename="([^"]+)"/i);
  return match?.[1] ?? "rekko-hours.csv";
}
