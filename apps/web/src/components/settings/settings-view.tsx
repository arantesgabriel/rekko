"use client";

import { useActionState } from "react";
import Link from "next/link";

import { SessionActions } from "@/components/auth/session-actions";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  updateAccountSettingsAction,
  updateWorkspaceSettingsAction,
  type SettingsActionState,
} from "@/modules/settings/actions";
import type { SettingsPageData } from "@/modules/settings/service";

const initialState: SettingsActionState = { status: "idle", message: "" };
const timezoneOptions = [
  "America/Sao_Paulo",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Lisbon",
  "Asia/Tokyo",
  "UTC",
];

export function SettingsView({
  data,
  workspaceSlug,
}: {
  data: SettingsPageData;
  workspaceSlug: string;
}) {
  const [accountState, accountAction, accountPending] = useActionState(
    updateAccountSettingsAction.bind(null, workspaceSlug),
    initialState,
  );
  const [workspaceState, workspaceAction, workspacePending] = useActionState(
    updateWorkspaceSettingsAction.bind(null, workspaceSlug),
    initialState,
  );
  const editableWorkspace = data.context.role !== "MEMBER";

  return (
    <div className="settings-page">
      <section
        className="settings-section"
        aria-labelledby="account-settings-title"
      >
        <div className="settings-section__heading">
          <div>
            <span className="eyebrow">Sua conta</span>
            <h2 id="account-settings-title">Perfil e timezone</h2>
          </div>
          <p>A timezone pessoal afeta Hoje, Timeline e seus Insights.</p>
        </div>
        <form action={accountAction} className="settings-form">
          <label>
            <span>Nome</span>
            <input defaultValue={data.account.name} name="name" required />
          </label>
          <label>
            <span>Email</span>
            <input defaultValue={data.account.email} disabled type="email" />
            <small>O email da conta não é alterado nesta fase.</small>
          </label>
          <label>
            <span>Sua timezone</span>
            <TimezoneSelect name="timezone" value={data.account.timezone} />
          </label>
          <div className="settings-form__footer">
            <button
              className="button button--primary"
              disabled={accountPending}
              type="submit"
            >
              {accountPending ? "Salvando…" : "Salvar conta"}
            </button>
            <ActionFeedback state={accountState} />
          </div>
        </form>
      </section>

      <section
        className="settings-section"
        aria-labelledby="workspace-settings-title"
      >
        <div className="settings-section__heading">
          <div>
            <span className="eyebrow">Workspace</span>
            <h2 id="workspace-settings-title">Identidade e timezone</h2>
          </div>
          <p>
            A timezone do Workspace é usada nos Relatórios e exports
            administrativos.
          </p>
        </div>
        {editableWorkspace ? (
          <form action={workspaceAction} className="settings-form">
            <label>
              <span>Nome do Workspace</span>
              <input defaultValue={data.context.name} name="name" required />
            </label>
            <label>
              <span>Timezone do Workspace</span>
              <TimezoneSelect name="timezone" value={data.context.timezone} />
              <small>Isso não altera sua timezone pessoal.</small>
            </label>
            <p className="settings-note">
              Slug: <code>{data.context.slug}</code>. O endereço do Workspace
              permanece o mesmo.
            </p>
            <div className="settings-form__footer">
              <button
                className="button button--primary"
                disabled={workspacePending}
                type="submit"
              >
                {workspacePending ? "Salvando…" : "Salvar Workspace"}
              </button>
              <ActionFeedback state={workspaceState} />
            </div>
          </form>
        ) : (
          <div className="settings-readonly">
            <p>
              As configurações do Workspace são administradas por Owner ou
              Admin.
            </p>
            <dl>
              <div>
                <dt>Nome</dt>
                <dd>{data.context.name}</dd>
              </div>
              <div>
                <dt>Timezone</dt>
                <dd>{data.context.timezone}</dd>
              </div>
              <div>
                <dt>Slug</dt>
                <dd>{data.context.slug}</dd>
              </div>
            </dl>
          </div>
        )}
      </section>

      <section
        className="settings-section"
        aria-labelledby="theme-settings-title"
      >
        <div className="settings-section__heading">
          <div>
            <span className="eyebrow">Aparência</span>
            <h2 id="theme-settings-title">Tema</h2>
          </div>
          <p>
            A preferência é salva neste dispositivo e funciona em Light e Dark.
          </p>
        </div>
        <div className="settings-inline-control">
          <span>Alternar tema claro/escuro</span>
          <ThemeSwitcher />
        </div>
      </section>

      <section
        className="settings-section"
        aria-labelledby="security-settings-title"
      >
        <div className="settings-section__heading">
          <div>
            <span className="eyebrow">Segurança</span>
            <h2 id="security-settings-title">Sessões e acesso</h2>
          </div>
          <p>
            Encerre a sessão atual ou todas as sessões abertas nos seus
            dispositivos.
          </p>
        </div>
        <div className="settings-security">
          <p>
            {data.security.hasPassword
              ? "Esta conta possui uma senha local configurada."
              : `Esta conta usa ${providerLabel(data.security.providers)} e não possui senha local.`}
          </p>
          <SessionActions />
        </div>
      </section>

      <section
        className="settings-section"
        aria-labelledby="integration-settings-title"
      >
        <div className="settings-section__heading">
          <div>
            <span className="eyebrow">Conexões</span>
            <h2 id="integration-settings-title">Integrações</h2>
          </div>
          <p>
            As conexões externas continuam na área própria para evitar
            formulários duplicados.
          </p>
        </div>
        <Link
          className="settings-link"
          href={`/w/${workspaceSlug}/integrations`}
        >
          Gerenciar integrações <span aria-hidden="true">→</span>
        </Link>
      </section>
    </div>
  );
}

function TimezoneSelect({ name, value }: { name: string; value: string }) {
  const options = timezoneOptions.includes(value)
    ? timezoneOptions
    : [value, ...timezoneOptions];
  return (
    <select defaultValue={value} name={name} required>
      {options.map((timezone) => (
        <option key={timezone} value={timezone}>
          {timezone}
        </option>
      ))}
    </select>
  );
}

function ActionFeedback({ state }: { state: SettingsActionState }) {
  if (state.status === "idle") return null;
  return (
    <p aria-live="polite" className={`settings-feedback is-${state.status}`}>
      {state.message}
    </p>
  );
}

function providerLabel(providers: string[]) {
  if (!providers.length) return "um provedor de acesso";
  return providers
    .map((provider) => (provider === "credential" ? "email e senha" : provider))
    .join(" e ");
}
