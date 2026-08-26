import { AppNavigation } from "@/components/app-navigation";
import { BrandMark } from "@/components/brand-mark";
import { ThemeSwitcher } from "@/components/theme-switcher";

export const metadata = { title: "App shell" };

export default function AppShellPage() {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <BrandMark />
        <button className="workspace-placeholder" type="button" disabled>
          <span className="workspace-placeholder__mark">R</span>
          <span>
            <strong>Workspace</strong>
            <small>Disponível na Fase 2</small>
          </span>
        </button>
        <AppNavigation />
        <div className="app-sidebar__footer">
          <ThemeSwitcher />
        </div>
      </aside>

      <main className="app-content">
        <div className="app-content__heading">
          <span className="status-dot" aria-hidden="true" />
          <span>Foundation</span>
        </div>
        <h1>A base do seu dia está pronta.</h1>
        <p>
          Este shell estabelece navegação, temas e ritmo visual. Dados reais e
          ações de produto entram somente nas fases correspondentes do roadmap.
        </p>
        <div
          className="timeline-placeholder"
          aria-label="Prévia abstrata de segmentos de tempo"
        >
          <span style={{ width: "28%" }} />
          <span style={{ width: "15%" }} />
          <span style={{ width: "40%" }} />
        </div>
      </main>

      <AppNavigation mobile />
    </div>
  );
}
