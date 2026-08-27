"use client";

import { useActionState, useId, useState } from "react";

import {
  completeOnboardingAction,
  type ActionState,
} from "@/modules/workspaces/actions";

type Invitation = {
  email: string;
  jobTitle: string;
  role: "ADMIN" | "MEMBER";
};
type Step = 1 | 2 | 3;

const initialActionState: ActionState = { message: "", status: "idle" };
const stepNames = ["Workspace", "Time", "Confirmar"];

function roleLabel(role: Invitation["role"]) {
  return role === "ADMIN" ? "Administrador" : "Membro";
}

export function OnboardingWizard({ timezone }: { timezone: string }) {
  const [actionState, action, pending] = useActionState(
    completeOnboardingAction,
    initialActionState,
  );
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [direction, setDirection] = useState<"back" | "forward">("forward");
  const [workspaceName, setWorkspaceName] = useState("");
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [draft, setDraft] = useState<Invitation>({
    email: "",
    jobTitle: "",
    role: "MEMBER",
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [workspaceError, setWorkspaceError] = useState("");
  const [invitationError, setInvitationError] = useState("");
  const descriptionId = useId();

  function goTo(step: Step) {
    setDirection(step < currentStep ? "back" : "forward");
    setCurrentStep(step);
  }

  function continueFromWorkspace() {
    const normalized = workspaceName.trim();
    if (normalized.length < 2) {
      setWorkspaceError("Informe pelo menos 2 caracteres.");
      return;
    }
    setWorkspaceName(normalized);
    setWorkspaceError("");
    goTo(2);
  }

  function saveInvitation() {
    const normalizedEmail = draft.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setInvitationError("Informe um e-mail válido.");
      return;
    }
    if (
      invitations.some(
        (invitation, index) =>
          invitation.email === normalizedEmail && index !== editingIndex,
      )
    ) {
      setInvitationError("Este e-mail já está na lista.");
      return;
    }
    const nextInvitation = {
      ...draft,
      email: normalizedEmail,
      jobTitle: draft.jobTitle.trim(),
    };
    setInvitations((current) =>
      editingIndex === null
        ? [...current, nextInvitation]
        : current.map((invitation, index) =>
            index === editingIndex ? nextInvitation : invitation,
          ),
    );
    setDraft({ email: "", jobTitle: "", role: "MEMBER" });
    setEditingIndex(null);
    setInvitationError("");
  }

  function editInvitation(index: number) {
    const invitation = invitations[index];
    if (!invitation) return;
    setDraft(invitation);
    setEditingIndex(index);
    setInvitationError("");
    if (currentStep !== 2) goTo(2);
  }

  function removeInvitation(index: number) {
    setInvitations((current) => current.filter((_, item) => item !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setDraft({ email: "", jobTitle: "", role: "MEMBER" });
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  }

  const stepCopy = {
    1: {
      description:
        "Crie seu workspace para organizar seu time, projetos e registros de tempo.",
      title: "Onde seu tempo acontece?",
    },
    2: {
      description:
        "Convide alguém agora ou continue sozinho. Você poderá adicionar mais pessoas depois.",
      title: "Quer trazer seu time?",
    },
    3: {
      description: "Revise as informações antes de criar seu workspace.",
      title: "Tudo certo por aqui?",
    },
  }[currentStep];

  return (
    <section
      aria-describedby={descriptionId}
      aria-labelledby="onboarding-title"
      className="onboarding-panel"
    >
      <nav className="onboarding-stepper" aria-label="Progresso do onboarding">
        <ol>
          {stepNames.map((name, index) => {
            const step = (index + 1) as Step;
            const state =
              step < currentStep
                ? "complete"
                : step === currentStep
                  ? "active"
                  : "future";
            return (
              <li
                aria-current={state === "active" ? "step" : undefined}
                data-state={state}
                key={name}
              >
                <span>{String(step).padStart(2, "0")}</span>
                <strong>{name}</strong>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="onboarding-panel__intro">
        <h1 id="onboarding-title">{stepCopy.title}</h1>
        <p id={descriptionId}>{stepCopy.description}</p>
      </div>

      <div
        className={`onboarding-stage onboarding-stage--${direction}`}
        key={currentStep}
      >
        {currentStep === 1 && (
          <form
            className="onboarding-form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              continueFromWorkspace();
            }}
          >
            <div className="field-group">
              <label htmlFor="workspace-name">Nome do workspace</label>
              <input
                aria-describedby={
                  workspaceError ? "workspace-name-error" : undefined
                }
                aria-invalid={Boolean(workspaceError)}
                autoComplete="organization"
                autoFocus
                id="workspace-name"
                maxLength={80}
                minLength={2}
                onChange={(event) => {
                  setWorkspaceName(event.target.value);
                  if (workspaceError) setWorkspaceError("");
                }}
                placeholder="Ex.: AidCrusader"
                value={workspaceName}
              />
              <span className="field-message" id="workspace-name-error">
                {workspaceError}
              </span>
            </div>
            <div className="onboarding-actions">
              <button className="button button--primary" type="submit">
                Continuar
              </button>
            </div>
          </form>
        )}

        {currentStep === 2 && (
          <div className="onboarding-team-step">
            <form
              className="invite-form invite-form--wizard"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                saveInvitation();
              }}
            >
              <div className="field-group invite-form__email">
                <label htmlFor="invite-email">E-mail</label>
                <input
                  aria-describedby={
                    invitationError ? "invite-error" : undefined
                  }
                  aria-invalid={Boolean(invitationError)}
                  id="invite-email"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="pessoa@empresa.com"
                  type="email"
                  value={draft.email}
                />
                <span className="field-message" id="invite-error">
                  {invitationError}
                </span>
              </div>
              <div className="field-group">
                <label htmlFor="invite-role">Permissão</label>
                <select
                  id="invite-role"
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      role: event.target.value as Invitation["role"],
                    }))
                  }
                  value={draft.role}
                >
                  <option value="MEMBER">Membro</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div className="field-group invite-form__job-title">
                <label htmlFor="invite-job-title">Cargo</label>
                <input
                  id="invite-job-title"
                  maxLength={100}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      jobTitle: event.target.value,
                    }))
                  }
                  placeholder="Ex.: Tech Lead"
                  value={draft.jobTitle}
                />
              </div>
              <button
                className="invite-form__add"
                disabled={invitations.length >= 10 && editingIndex === null}
                type="submit"
              >
                {editingIndex === null
                  ? "+ Adicionar convite"
                  : "Salvar alterações"}
              </button>
            </form>

            {invitations.length > 0 && (
              <ul
                className="onboarding-invitations"
                aria-label="Convites adicionados"
              >
                {invitations.map((invitation, index) => (
                  <li key={invitation.email}>
                    <div>
                      <strong>{invitation.email}</strong>
                      <span>
                        {roleLabel(invitation.role)}
                        {invitation.jobTitle ? ` · ${invitation.jobTitle}` : ""}
                      </span>
                    </div>
                    <div>
                      <button
                        onClick={() => editInvitation(index)}
                        type="button"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => removeInvitation(index)}
                        type="button"
                      >
                        Remover
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="onboarding-actions">
              <button
                className="button button--tertiary"
                onClick={() => goTo(1)}
                type="button"
              >
                <span aria-hidden="true">←</span>
                <span>Voltar</span>
              </button>
              <button
                className="button button--primary"
                onClick={() => goTo(3)}
                type="button"
              >
                {invitations.length > 0
                  ? "Continuar"
                  : "Continuar sem trazer ninguém"}
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <form action={action} className="onboarding-review">
            <input name="name" type="hidden" value={workspaceName} />
            <input name="timezone" type="hidden" value={timezone} />
            <input
              name="invitations"
              type="hidden"
              value={JSON.stringify(invitations)}
            />

            <section
              aria-labelledby="review-workspace-title"
              className="review-section"
            >
              <div className="review-section__heading">
                <h2 id="review-workspace-title">Workspace</h2>
                <button onClick={() => goTo(1)} type="button">
                  Editar
                </button>
              </div>
              <p className="review-section__value">{workspaceName}</p>
            </section>

            <section
              aria-labelledby="review-team-title"
              className="review-section"
            >
              <div className="review-section__heading">
                <h2 id="review-team-title">Time</h2>
                <button onClick={() => goTo(2)} type="button">
                  {invitations.length ? "Editar" : "Adicionar"}
                </button>
              </div>
              {invitations.length ? (
                <ul>
                  {invitations.map((invitation) => (
                    <li key={invitation.email}>
                      <strong>{invitation.email}</strong>
                      <span>
                        {roleLabel(invitation.role)}
                        {invitation.jobTitle ? ` · ${invitation.jobTitle}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="review-section__value review-section__value--muted">
                  Nenhuma pessoa adicionada
                </p>
              )}
            </section>

            {actionState.message && (
              <p
                className={`form-message form-message--${actionState.status}`}
                role="alert"
              >
                {actionState.message}
              </p>
            )}

            <div className="onboarding-actions">
              <button
                className="button button--tertiary"
                disabled={pending}
                onClick={() => goTo(2)}
                type="button"
              >
                <span aria-hidden="true">←</span>
                <span>Voltar</span>
              </button>
              <button
                className="button button--primary"
                disabled={pending}
                type="submit"
              >
                {pending ? "Criando seu workspace..." : "Criar workspace"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
