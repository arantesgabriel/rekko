"use client";

export default function ReportsError({ reset }: { reset: () => void }) {
  return (
    <div className="reports-error" role="alert">
      <h1 className="section-title">
        Não conseguimos carregar este relatório agora.
      </h1>
      <p>Tente novamente em alguns instantes.</p>
      <button
        className="button button--secondary"
        onClick={reset}
        type="button"
      >
        Tentar novamente
      </button>
    </div>
  );
}
