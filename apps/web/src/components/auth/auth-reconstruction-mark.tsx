export function AuthReconstructionMark() {
  return (
    <svg
      aria-hidden="true"
      className="auth-mark"
      fill="none"
      viewBox="0 0 176 52"
    >
      <path className="auth-mark__rail" d="M7 4v16M7 28v20" />
      <rect
        className="auth-mark__seg"
        height="10"
        rx="5"
        width="38"
        x="18"
        y="18"
      />
      <line className="auth-mark__gap" x1="62" x2="82" y1="23" y2="23" />
      <rect
        className="auth-mark__seg"
        height="16"
        rx="7"
        width="76"
        x="86"
        y="14"
      />
      <path className="auth-mark__link" d="M56 28C64 40 78 40 86 30" />
      <circle className="auth-mark__node" cx="18" cy="23" r="2.8" />
      <circle className="auth-mark__node" cx="162" cy="22" r="3.2" />
    </svg>
  );
}
