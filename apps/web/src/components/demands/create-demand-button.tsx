"use client";

export function CreateDemandButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="button button--primary button--sm demands-create-button"
      onClick={onClick}
      type="button"
    >
      <span aria-hidden="true">+</span>
      Nova demanda
    </button>
  );
}
