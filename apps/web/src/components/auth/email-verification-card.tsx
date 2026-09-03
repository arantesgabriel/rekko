"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { SessionActions } from "@/components/auth/session-actions";
import { authClient } from "@/modules/auth/auth-client";
import {
  isLikelyNetworkError,
  mapAuthApiError,
  validateAuthEmail,
} from "@/modules/auth/auth-form-validation";

const RESEND_COOLDOWN_SECONDS = 60;

type EmailVerificationCardProps = {
  email?: string | undefined;
  showSessionActions?: boolean;
  token?: string | undefined;
};

export function EmailVerificationCard({
  email: initialEmail,
  showSessionActions = false,
  token,
}: EmailVerificationCardProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail?.trim() ?? "");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown === 0) return;
    const timeout = window.setTimeout(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [cooldown]);

  function resetFeedback() {
    setMessage("");
    setSuccess(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || cooldown > 0) return;

    if (token) {
      setLoading(true);
      resetFeedback();
      try {
        const result = await authClient.verifyEmail({
          query: { token, callbackURL: "/app" },
        });
        if (result.error) throw new Error("TOKEN");
        setSuccess(true);
        setMessage("E-mail confirmado. Sua conta está pronta.");
        router.push("/app");
        router.refresh();
      } catch (error) {
        setMessage(
          isLikelyNetworkError(error)
            ? "Não foi possível conectar. Verifique sua conexão e tente novamente."
            : mapAuthApiError({ kind: "TOKEN" }),
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    const normalizedEmail = email.trim();
    const nextEmailError = validateAuthEmail(normalizedEmail);
    setEmailError(nextEmailError);
    if (nextEmailError) return;

    setLoading(true);
    resetFeedback();
    try {
      const result = await authClient.sendVerificationEmail({
        email: normalizedEmail,
        callbackURL: "/app",
      });
      if (result.error) {
        const mapped = mapAuthApiError({
          code: result.error.code,
          message: result.error.message,
          status: result.error.status,
        });
        throw new Error(mapped);
      }
      setEmail(normalizedEmail);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setSuccess(true);
      setMessage(`E-mail reenviado para ${normalizedEmail}.`);
    } catch (error) {
      if (isLikelyNetworkError(error)) {
        setMessage(
          "Não foi possível conectar. Verifique sua conexão e tente novamente.",
        );
      } else if (error instanceof Error && error.message.startsWith("Muitas")) {
        setMessage(error.message);
      } else {
        setMessage(
          "Não foi possível reenviar o e-mail. Tente novamente em alguns instantes.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const hasRecipient = Boolean(email);
  const feedbackId = "email-verification-feedback";
  const emailErrorId = "email-verification-error";

  return (
    <section
      aria-labelledby="email-verification-title"
      className="email-verification-card"
    >
      <div className="email-verification-card__icon" aria-hidden="true">
        <MailIcon />
      </div>
      <div className="email-verification-card__heading">
        <h1 id="email-verification-title">Confirme seu e-mail</h1>
        {token ? (
          <p>Confirme o endereço usado na sua conta para continuar no Rekko.</p>
        ) : hasRecipient ? (
          <>
            <p>
              Enviamos um link de confirmação para <strong>{email}</strong>.
            </p>
            <p>Abra o e-mail e confirme sua conta para continuar no Rekko.</p>
          </>
        ) : (
          <p>Digite seu e-mail para receber um novo link de confirmação.</p>
        )}
      </div>

      <form
        className="email-verification-card__form"
        noValidate
        onSubmit={submit}
      >
        {!token && !hasRecipient ? (
          <div className="email-verification-card__field">
            <label htmlFor="verification-email">E-mail</label>
            <input
              aria-describedby={emailError ? emailErrorId : undefined}
              aria-invalid={emailError ? true : undefined}
              autoComplete="email"
              id="verification-email"
              onChange={(event) => {
                setEmail(event.currentTarget.value);
                if (emailError) setEmailError("");
              }}
              type="email"
              value={email}
            />
            {emailError ? (
              <p
                className="email-verification-card__field-error"
                id={emailErrorId}
              >
                {emailError}
              </p>
            ) : null}
          </div>
        ) : null}

        {message ? (
          <p
            aria-live="polite"
            className={`email-verification-card__feedback${success ? " is-success" : " is-error"}`}
            id={feedbackId}
            role={success ? "status" : "alert"}
          >
            <FeedbackIcon success={success} />
            <span>{message}</span>
          </p>
        ) : null}

        <button
          aria-busy={loading}
          aria-describedby={message ? feedbackId : undefined}
          className="button button--primary email-verification-card__submit"
          disabled={loading || cooldown > 0}
          type="submit"
        >
          {loading ? (
            <span className="button-loader">
              <i />
              <i />
              <i />
              {token ? "Confirmando…" : "Enviando…"}
            </span>
          ) : token ? (
            "Confirmar e continuar"
          ) : cooldown > 0 ? (
            `Reenviar em ${cooldown}s`
          ) : (
            "Reenviar e-mail de confirmação"
          )}
        </button>
      </form>

      {!token ? (
        <p className="email-verification-card__helper">
          Não encontrou o e-mail? Verifique também sua caixa de spam.
        </p>
      ) : null}

      {showSessionActions ? (
        <SessionActions variant="verification" />
      ) : (
        <Link className="email-verification-card__account-link" href="/login">
          Usar outra conta
        </Link>
      )}
    </section>
  );
}

function MailIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24">
      <rect
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
        width="18"
        x="3"
        y="5"
      />
      <path
        d="m4.5 7 6.12 4.67a2.3 2.3 0 0 0 2.76 0L19.5 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function FeedbackIcon({ success }: { success: boolean }) {
  return success ? (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="m6.5 10 2.2 2.2 4.8-4.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  ) : (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 6.3v4.1M10 13.6v.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}
