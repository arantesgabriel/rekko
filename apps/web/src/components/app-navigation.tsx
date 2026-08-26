const navigation = ["Today", "Timeline", "Work", "Insights"] as const;

export function AppNavigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav
      className={mobile ? "app-nav app-nav--mobile" : "app-nav"}
      aria-label="Navegação principal"
    >
      {navigation.map((label, index) => (
        <a
          aria-current={index === 0 ? "page" : undefined}
          className="app-nav__item"
          href={`#${label.toLowerCase()}`}
          key={label}
        >
          <span className="app-nav__dot" aria-hidden="true" />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}
