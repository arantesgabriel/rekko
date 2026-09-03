"use client";

export function CreateDemandButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      aria-label="Nova demanda"
      className="button button--primary button--icon demands-create-button"
      onClick={onClick}
      title="Nova demanda"
      type="button"
    >
      <span aria-hidden="true">+</span>
      <span className="demands-create-button__label">Nova demanda</span>
    </button>
  );
}
