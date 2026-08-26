"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const themes = [
  { label: "Claro", value: "light" },
  { label: "Escuro", value: "dark" },
  { label: "Sistema", value: "system" },
] as const;

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
          aria-pressed={mounted && theme === option.value}
          className="theme-switcher__option"
          disabled={!mounted}
          key={option.value}
          onClick={() => setTheme(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
