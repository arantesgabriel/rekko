import Link from "next/link";

export function WorkspaceSwitcher({
  currentSlug,
  workspaces,
}: {
  currentSlug: string;
  workspaces: { name: string; slug: string }[];
}) {
  const current = workspaces.find((item) => item.slug === currentSlug);
  return (
    <details className="workspace-switcher">
      <summary aria-label="Trocar Workspace">
        <span className="workspace-avatar" aria-hidden="true">
          {current?.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="workspace-switcher__label">
          <small>Workspace</small>
          <strong>{current?.name}</strong>
        </span>
        <span aria-hidden="true">⌄</span>
      </summary>
      <div className="workspace-switcher__menu">
        <p>Seus Workspaces</p>
        {workspaces.map((item) => (
          <Link
            aria-current={item.slug === currentSlug ? "page" : undefined}
            href={`/w/${item.slug}`}
            key={item.slug}
          >
            <span className="workspace-avatar" aria-hidden="true">
              {item.name.slice(0, 1).toUpperCase()}
            </span>
            {item.name}
          </Link>
        ))}
        <Link className="workspace-switcher__create" href="/workspaces/new">
          + Criar Workspace
        </Link>
      </div>
    </details>
  );
}
