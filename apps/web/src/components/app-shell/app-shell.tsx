"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { WorkspaceSwitcher } from "@/components/workspaces/workspace-switcher";
import { AppAccountMenu } from "@/components/app-shell/account-menu";
import {
  CollapseIcon,
  DemandsIcon,
  ExpandIcon,
  HomeIcon,
  IntegrationsIcon,
  InsightsIcon,
  MembersIcon,
  MenuIcon,
  ProjectsIcon,
  ReportsIcon,
} from "@/components/app-shell/icons";

const SIDEBAR_COOKIE = "rekko-sidebar";
const SIDEBAR_MAX_AGE = 60 * 60 * 24 * 365;

type WorkspaceOption = { name: string; slug: string };

export function AppShell({
  banner,
  children,
  collapsed: initialCollapsed,
  timer,
  userName,
  userRoleLabel,
  workspaces,
  workspaceSlug,
}: {
  banner?: ReactNode;
  children: ReactNode;
  collapsed: boolean;
  timer?: ReactNode;
  userName: string;
  userRoleLabel: string;
  workspaces: WorkspaceOption[];
  workspaceSlug: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  function persistCollapsed(next: boolean) {
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "expanded"}; path=/; max-age=${SIDEBAR_MAX_AGE}; SameSite=Lax`;
  }

  return (
    <div
      className="app-shell"
      data-collapsed={collapsed ? "true" : undefined}
      data-has-timer={timer ? "true" : undefined}
    >
      <aside className="app-sidebar" aria-label="Barra lateral">
        <SidebarBody
          collapsed={collapsed}
          onToggle={() => persistCollapsed(!collapsed)}
          pathname={pathname}
          userName={userName}
          userRoleLabel={userRoleLabel}
          workspaces={workspaces}
          workspaceSlug={workspaceSlug}
        />
      </aside>
      <div className="app-shell__column">
        <MobileShellControls
          key={pathname}
          pathname={pathname}
          userName={userName}
          userRoleLabel={userRoleLabel}
          workspaces={workspaces}
          workspaceSlug={workspaceSlug}
        />
        {banner ? <div className="app-notice">{banner}</div> : null}
        <div className="app-shell__scroll">{children}</div>
        {timer}
        <MobileBottomNav pathname={pathname} workspaceSlug={workspaceSlug} />
      </div>
    </div>
  );
}

function MobileShellControls({
  pathname,
  userName,
  userRoleLabel,
  workspaces,
  workspaceSlug,
}: {
  pathname: string;
  userName: string;
  userRoleLabel: string;
  workspaces: WorkspaceOption[];
  workspaceSlug: string;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const drawerTitleId = useId();

  useEffect(() => {
    const pageScroll =
      document.querySelector<HTMLElement>(".app-shell__scroll");
    const previousOverflow = pageScroll?.style.overflow;

    if (!drawerOpen) return;
    if (pageScroll) pageScroll.style.overflow = "hidden";
    drawerCloseRef.current?.focus();
    const menuButton = menuButtonRef.current;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (pageScroll) pageScroll.style.overflow = previousOverflow ?? "";
      menuButton?.focus();
    };
  }, [drawerOpen]);

  return (
    <>
      <header className="app-mobile-header">
        <button
          aria-expanded={drawerOpen}
          aria-label="Abrir menu"
          className="button button--ghost button--icon"
          onClick={() => setDrawerOpen(true)}
          ref={menuButtonRef}
          type="button"
        >
          <MenuIcon />
        </button>
        <WorkspaceSwitcher
          currentSlug={workspaceSlug}
          workspaces={workspaces}
        />
        <AppAccountMenu
          compact
          name={userName}
          roleLabel={userRoleLabel}
          workspaceSlug={workspaceSlug}
        />
      </header>
      {drawerOpen ? (
        <div className="app-drawer-backdrop">
          <button
            aria-label="Fechar menu"
            className="app-drawer-backdrop__dismiss"
            onClick={() => setDrawerOpen(false)}
            type="button"
          />
          <aside
            aria-labelledby={drawerTitleId}
            aria-modal="true"
            className="app-drawer"
            role="dialog"
          >
            <h2 className="sr-only" id={drawerTitleId}>
              Menu do Workspace
            </h2>
            <SidebarBody
              collapsed={false}
              closeRef={drawerCloseRef}
              onClose={() => setDrawerOpen(false)}
              pathname={pathname}
              userName={userName}
              userRoleLabel={userRoleLabel}
              workspaces={workspaces}
              workspaceSlug={workspaceSlug}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}

function SidebarBody({
  collapsed,
  closeRef,
  onClose,
  onToggle,
  pathname,
  userName,
  userRoleLabel,
  workspaces,
  workspaceSlug,
}: {
  collapsed: boolean;
  closeRef?: RefObject<HTMLButtonElement | null>;
  onClose?: () => void;
  onToggle?: () => void;
  pathname: string;
  userName: string;
  userRoleLabel: string;
  workspaces: WorkspaceOption[];
  workspaceSlug: string;
}) {
  const home = `/w/${workspaceSlug}`;
  const sidebarItemBehavior = onClose ? { onClick: onClose } : {};
  return (
    <>
      <div className="app-sidebar__top">
        <BrandMark href={home} variant={collapsed ? "mark" : "wordmark"} />
        {onToggle ? (
          <button
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            className="app-sidebar__collapse"
            onClick={onToggle}
            type="button"
          >
            {collapsed ? <ExpandIcon /> : <CollapseIcon />}
          </button>
        ) : null}
        {onClose ? (
          <button
            aria-label="Fechar menu"
            className="app-sidebar__collapse"
            onClick={onClose}
            ref={closeRef}
            type="button"
          >
            <CollapseIcon />
          </button>
        ) : null}
      </div>
      <WorkspaceSwitcher
        compact={collapsed}
        currentSlug={workspaceSlug}
        workspaces={workspaces}
      />
      <nav className="app-sidebar__nav" aria-label="Navegação do Workspace">
        <SidebarItem
          collapsed={collapsed}
          current={pathname === home}
          href={home}
          icon={<HomeIcon />}
          label="Home"
          {...sidebarItemBehavior}
        />
        <SidebarItem
          collapsed={collapsed}
          current={pathname.startsWith(`${home}/work`)}
          href={`${home}/work`}
          icon={<DemandsIcon />}
          label="Demandas"
          {...sidebarItemBehavior}
        />
        <SidebarItem
          collapsed={collapsed}
          current={pathname.startsWith(`${home}/projects`)}
          href={`${home}/projects`}
          icon={<ProjectsIcon />}
          label="Projetos"
          {...sidebarItemBehavior}
        />
        <SidebarItem
          collapsed={collapsed}
          current={pathname.startsWith(`${home}/insights`)}
          href={`${home}/insights`}
          icon={<InsightsIcon />}
          label="Insights"
          {...sidebarItemBehavior}
        />
        <SidebarItem
          collapsed={collapsed}
          current={pathname.startsWith(`${home}/reports`)}
          href={`${home}/reports`}
          icon={<ReportsIcon />}
          label="Relatórios"
          {...sidebarItemBehavior}
        />
        <SidebarItem
          collapsed={collapsed}
          current={pathname.startsWith(`${home}/members`)}
          href={`${home}/members`}
          icon={<MembersIcon />}
          label="Membros"
          {...sidebarItemBehavior}
        />
        <SidebarItem
          collapsed={collapsed}
          current={pathname.startsWith(`${home}/integrations`)}
          href={`${home}/integrations`}
          icon={<IntegrationsIcon />}
          label="Integrações"
          {...sidebarItemBehavior}
        />
      </nav>
      <div className="app-sidebar__footer">
        <AppAccountMenu
          compact={collapsed}
          name={userName}
          roleLabel={userRoleLabel}
          workspaceSlug={workspaceSlug}
        />
      </div>
    </>
  );
}

function SidebarItem({
  collapsed,
  current,
  disabled,
  href,
  icon,
  label,
  onClick,
}: {
  collapsed: boolean;
  current?: boolean;
  disabled?: boolean;
  href?: string;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="app-nav-item__icon">{icon}</span>
      <span className="app-nav-item__label">{label}</span>
      {disabled ? <small>Em breve</small> : null}
    </>
  );
  if (disabled || !href) {
    return (
      <span
        className="app-nav-item is-disabled"
        title={collapsed ? `${label} · em breve` : undefined}
      >
        {content}
      </span>
    );
  }
  return (
    <Link
      aria-current={current ? "page" : undefined}
      className="app-nav-item"
      href={href}
      title={collapsed ? label : undefined}
      {...(onClick ? { onClick } : {})}
    >
      {content}
    </Link>
  );
}

function MobileBottomNav({
  pathname,
  workspaceSlug,
}: {
  pathname: string;
  workspaceSlug: string;
}) {
  const home = `/w/${workspaceSlug}`;
  const items = [
    {
      current: pathname === home,
      href: home,
      icon: <HomeIcon />,
      label: "Home",
    },
    {
      current: pathname.startsWith(`${home}/work`),
      href: `${home}/work`,
      icon: <DemandsIcon />,
      label: "Demandas",
    },
    {
      current: pathname.startsWith(`${home}/projects`),
      href: `${home}/projects`,
      icon: <ProjectsIcon />,
      label: "Projetos",
    },
    {
      current: pathname.startsWith(`${home}/insights`),
      href: `${home}/insights`,
      icon: <InsightsIcon />,
      label: "Insights",
    },
  ];
  return (
    <nav className="app-bottom-nav" aria-label="Navegação principal">
      {items.map((item) => (
        <Link
          aria-current={item.current ? "page" : undefined}
          className="app-bottom-nav__item"
          href={item.href}
          key={item.label}
        >
          <span className="app-bottom-nav__icon">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
