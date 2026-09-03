"use client";

export function CompactCreateButton({
  buttonClassName,
  labelClassName,
  label,
  onClick,
}: {
  buttonClassName?: string;
  labelClassName?: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <span className="compact-create-button__slot">
      <button
        aria-label={label}
        className={`button button--primary compact-create-button${buttonClassName ? ` ${buttonClassName}` : ""}`}
        onClick={onClick}
        title={label}
        type="button"
      >
        <span className="compact-create-button__cluster">
          <span aria-hidden="true" className="compact-create-button__icon">
            +
          </span>
          <span
            className={`compact-create-button__label${labelClassName ? ` ${labelClassName}` : ""}`}
          >
            {label}
          </span>
        </span>
      </button>
    </span>
  );
}
