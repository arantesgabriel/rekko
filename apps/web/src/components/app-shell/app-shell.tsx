"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { WorkspaceSwitcher } from "@/components/workspaces/workspace-switcher";
import { AppAccountMenu } from "@/components/app-shell/account-menu";
import {
  CollapseIcon,
  ExpandIcon,
  HomeIcon,
  IntegrationsIcon,
  InsightsIcon,
  MembersIcon,
  MenuIcon,
  ProjectsIcon,
  ReportsIcon,
  TimelineIcon,
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPath, setDrawerPath] = useState(pathname);
  const drawerTitleId = useId();

  if (drawerPath !== pathname) {
    setDrawerPath(pathname);
    setDrawerOpen(false);
  }

  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

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
        <header className="app-mobile-header">
          <button
            aria-expanded={drawerOpen}
            aria-label="Abrir menu"
            className="button button--ghost button--icon"
            onClick={() => setDrawerOpen(true)}
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
        {banner ? <div className="app-notice">{banner}</div> : null}
        <div className="app-shell__scroll">{children}</div>
        {timer}
      </div>
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
    </div>
  );
}

function SidebarBody({
  collapsed,
  onClose,
  onToggle,
  pathname,
  userName,
  userRoleLabel,
  workspaces,
  workspaceSlug,
}: {
  collapsed: boolean;
  onClose?: () => void;
  onToggle?: () => void;
  pathname: string;
  userName: string;
  userRoleLabel: string;
  workspaces: WorkspaceOption[];
  workspaceSlug: string;
}) {
  const home = `/w/${workspaceSlug}`;
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
          label="Hoje"
        />
        <SidebarItem
          collapsed={collapsed}
          current={pathname === home}
          href={home}
          icon={<TimelineIcon />}
          label="Timeline"
        />
        <SidebarItem
          collapsed={collapsed}
          current={
            pathname.startsWith(`${home}/work`) ||
            pathname.startsWith(`${home}/projects`)
          }
          href={`${home}/work`}
          icon={<ProjectsIcon />}
          label="Projetos"
        />
        <SidebarItem
          collapsed={collapsed}
          current={pathname.startsWith(`${home}/insights`)}
          href={`${home}/insights`}
          icon={<InsightsIcon />}
          label="Insights"
        />
        <SidebarItem
          collapsed={collapsed}
          current={pathname.startsWith(`${home}/reports`)}
          href={`${home}/reports`}
          icon={<ReportsIcon />}
          label="Relatórios"
        />
        <SidebarItem
          collapsed={collapsed}
          current={pathname.startsWith(`${home}/members`)}
          href={`${home}/members`}
          icon={<MembersIcon />}
          label="Membros"
        />
        <SidebarItem
          collapsed={collapsed}
          current={pathname.startsWith(`${home}/integrations`)}
          href={`${home}/integrations`}
          icon={<IntegrationsIcon />}
          label="Integrações"
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
}: {
  collapsed: boolean;
  current?: boolean;
  disabled?: boolean;
  href?: string;
  icon: ReactNode;
  label: string;
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
    >
      {content}
    </Link>
  );
}
