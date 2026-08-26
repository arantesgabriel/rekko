"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const themes = [
  { Icon: SunIcon, label: "Usar tema claro", value: "light" },
  { Icon: MoonIcon, label: "Usar tema escuro", value: "dark" },
  { Icon: SystemIcon, label: "Usar tema do sistema", value: "system" },
] as const;

type IconProps = { className?: string };

function SunIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.5v2M12 19.5v2M4.5 12h-2M21.5 12h-2M5.28 5.28l1.42 1.42M17.3 17.3l1.42 1.42M18.72 5.28 17.3 6.7M6.7 17.3l-1.42 1.42" />
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
      <path d="M20 15.1A8.5 8.5 0 0 1 8.9 4a8.5 8.5 0 1 0 11.1 11.1Z" />
    </svg>
  );
}

function SystemIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <rect height="12" rx="2" width="18" x="3" y="4" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

export function ThemeSwitcher() {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const { setTheme, theme } = useTheme();

  return (
    <div className="theme-switcher" role="group" aria-label="Tema da interface">
      {themes.map((option) => (
        <button
          aria-label={option.label}
          aria-pressed={mounted && theme === option.value}
          className="theme-switcher__option"
          disabled={!mounted}
          key={option.value}
          onClick={() => setTheme(option.value)}
          title={option.label}
          type="button"
        >
          <option.Icon className="theme-switcher__icon" />
        </button>
      ))}
    </div>
  );
}
