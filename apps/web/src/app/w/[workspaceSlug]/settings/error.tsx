"use client";

export default function SettingsError({ reset }: { reset: () => void }) {
  return (
    <main className="settings-error">
      <span className="eyebrow">Configurações</span>
      <h1>Não conseguimos carregar esta página.</h1>
      <p>Confira sua conexão e tente novamente.</p>
      <button
        className="button button--secondary"
        onClick={reset}
        type="button"
      >
        Tentar novamente
      </button>
    </main>
  );
}
