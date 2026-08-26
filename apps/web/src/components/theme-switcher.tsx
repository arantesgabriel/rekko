"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

type IconProps = { className?: string };

function SunIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" fill="currentColor" r="4" />
      <path
        d="M12 3v1.6M12 19.4V21M4.6 12H3M21 12h-1.6M6.05 6.05l1.13 1.13M16.82 16.82l1.13 1.13M17.95 6.05l-1.13 1.13M7.18 16.82l-1.13 1.13"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MoonIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M20 15.15A8.4 8.4 0 0 1 8.85 4 8.4 8.4 0 1 0 20 15.15Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ThemeSwitcher() {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = mounted && resolvedTheme === "dark";
  const label = isDark ? "Usar tema claro" : "Usar tema escuro";

  return (
    <button
      aria-label={label}
      aria-pressed={isDark}
      className={`theme-switcher${isDark ? " is-dark" : ""}`}
      disabled={!mounted}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={label}
      type="button"
    >
      <span className="theme-switcher__thumb">
        {isDark ? (
          <MoonIcon className="theme-switcher__icon" />
        ) : (
          <SunIcon className="theme-switcher__icon" />
        )}
      </span>
    </button>
  );
}
