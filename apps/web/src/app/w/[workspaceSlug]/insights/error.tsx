"use client";

export default function InsightsError({ reset }: { reset: () => void }) {
  return (
    <div className="insights-error" role="alert">
      <h1 className="section-title">
        Não conseguimos carregar seus insights agora.
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
