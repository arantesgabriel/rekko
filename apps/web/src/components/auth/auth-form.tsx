"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useId, useState, type InputHTMLAttributes } from "react";

import { authClient } from "@/modules/auth/auth-client";
import {
  isLikelyNetworkError,
  mapAuthApiError,
  validateAuthEmail,
  validateAuthName,
  validateAuthPassword,
} from "@/modules/auth/auth-form-validation";

type Mode = "forgot" | "login" | "reset" | "signup" | "verify";

const content = {
  login: [
    "Que bom ter você de volta.",
    "Entre para continuar reconstruindo sua jornada.",
  ],
  signup: [
    "Crie sua conta.",
    "Comece gratuitamente e transforme tempo em contexto.",
  ],
  forgot: [
    "Recupere seu acesso.",
    "Enviaremos um link se houver uma conta com este email.",
  ],
  reset: [
    "Crie uma nova senha.",
    "Escolha uma senha segura para voltar ao Rekko.",
  ],
  verify: [
    "Confirme seu email.",
    "Use o link enviado para concluir a confirmação.",
  ],
} as const;

type FieldErrors = {
  email?: string;
  name?: string;
  password?: string;
};

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState<"form" | "google" | false>(false);
  const [existingAccount, setExistingAccount] = useState(false);
  const [message, setMessage] = useState(
    params.get("error")
      ? "Não foi possível continuar com o Google. Tente novamente."
      : "",
  );
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function setFieldError(name: keyof FieldErrors, value: string) {
    setFieldErrors((current) => ({ ...current, [name]: value }));
  }

  function validateField(name: keyof FieldErrors, value: string) {
    if (name === "name") return validateAuthName(value);
    if (name === "email") return validateAuthEmail(value);
    return validateAuthPassword(value);
  }

  function validateForm(data: FormData) {
    const next: FieldErrors = {};
    if (mode === "signup") {
      next.name = validateAuthName(String(data.get("name") ?? ""));
    }
    if (mode !== "reset") {
      next.email = validateAuthEmail(String(data.get("email") ?? ""));
    }
    if (mode === "login" || mode === "signup" || mode === "reset") {
      next.password = validateAuthPassword(String(data.get("password") ?? ""));
    }
    setFieldErrors(next);
    setTouched({
      name: true,
      email: true,
      password: true,
    });
    return !Object.values(next).some(Boolean);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!validateForm(data)) return;
    setLoading("form");
    setMessage("");
    setExistingAccount(false);
    setSuccess(false);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    try {
      if (mode === "login") {
        const result = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/app",
        });
        if (result.error) {
          setMessage(
            mapAuthApiError({
              code: result.error.code,
              kind: "CREDENTIALS",
              message: result.error.message,
              status: result.error.status,
            }),
          );
          return;
        }
        router.push("/app");
        router.refresh();
        return;
      }
      if (mode === "signup") {
        const name = String(data.get("name") ?? "").trim();
        const result = await authClient.signUp.email({
          email,
          name,
          password,
          callbackURL: "/app",
        });
        if (result.error) {
          const mapped = mapAuthApiError({
            code: result.error.code,
            kind: "SIGNUP",
            message: result.error.message,
            status: result.error.status,
          });
          if (mapped === "EXISTS") {
            setExistingAccount(true);
            setMessage("Já existe uma conta com este email.");
            return;
          }
          setMessage(mapped);
          return;
        }
        setSuccess(true);
        setMessage("Conta criada. Enviamos um link para confirmar seu email.");
        setTimeout(() => router.push("/app"), 700);
        return;
      }
      if (mode === "forgot") {
        await authClient.requestPasswordReset({
          email,
          redirectTo: "/reset-password",
        });
        setSuccess(true);
        setMessage(
          "Se houver uma conta com este email, você receberá um link em instantes.",
        );
        return;
      }
      if (mode === "reset") {
        const token = params.get("token");
        if (!token) throw new Error("TOKEN");
        const result = await authClient.resetPassword({
          newPassword: password,
          token,
        });
        if (result.error) throw new Error("TOKEN");
        setSuccess(true);
        setMessage("Senha redefinida. Você já pode entrar novamente.");
        return;
      }
      if (mode === "verify") {
        const token = params.get("token");
        if (token) {
          const result = await authClient.verifyEmail({
            query: { token, callbackURL: "/app" },
          });
          if (result.error) throw new Error("TOKEN");
          setSuccess(true);
          setMessage("Email confirmado. Sua conta está pronta.");
          router.push("/app");
          router.refresh();
          return;
        }
        const result = await authClient.sendVerificationEmail({
          email,
          callbackURL: "/app",
        });
        if (result.error) throw new Error("SEND");
        setSuccess(true);
        setMessage("Enviamos um novo link de confirmação.");
      }
    } catch (error) {
      if (isLikelyNetworkError(error)) {
        setMessage(
          "Não foi possível conectar. Verifique sua conexão e tente novamente.",
        );
        return;
      }
      const kind = error instanceof Error ? error.message : "SERVER";
      setMessage(mapAuthApiError({ kind }));
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    if (loading) return;
    setLoading("google");
    setMessage("");
    setExistingAccount(false);
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/app",
        errorCallbackURL: "/login?error=oauth",
      });
      if (result.error) {
        setMessage(
          mapAuthApiError({
            kind: "OAUTH",
            message: result.error.message,
            status: result.error.status,
          }),
        );
        setLoading(false);
      }
    } catch (error) {
      setMessage(
        isLikelyNetworkError(error)
          ? "Não foi possível conectar. Verifique sua conexão e tente novamente."
          : "Não foi possível continuar com o Google. Tente novamente.",
      );
      setLoading(false);
    }
  }

  const [title, description] = content[mode];
  const busy = Boolean(loading);
  return (
    <section className="auth-card" aria-labelledby="auth-title">
      <div className="auth-card__heading">
        <h1 id="auth-title">{title}</h1>
        <p>{description}</p>
      </div>
      {(mode === "login" || mode === "signup") && (
        <>
          <button
            aria-busy={loading === "google"}
            className="google-button"
            disabled={busy}
            onClick={google}
            type="button"
          >
            <GoogleIcon />
            {loading === "google" ? "Continuando…" : "Continuar com Google"}
          </button>
          <div className="auth-divider">
            <span>ou continue com email</span>
          </div>
        </>
      )}
      <form noValidate onSubmit={submit}>
        {mode === "signup" && (
          <Field
            autoComplete="name"
            error={fieldErrors.name}
            label="Nome"
            name="name"
            onBlurValue={(value) => {
              setTouched((current) => ({ ...current, name: true }));
              setFieldError("name", validateField("name", value));
            }}
            onChangeValue={(value) => {
              if (touched.name)
                setFieldError("name", validateField("name", value));
            }}
            placeholder="Como podemos chamar você?"
          />
        )}
        {mode !== "reset" && (
          <Field
            autoComplete="email"
            error={fieldErrors.email}
            label="Email"
            name="email"
            onBlurValue={(value) => {
              setTouched((current) => ({ ...current, email: true }));
              setFieldError("email", validateField("email", value));
            }}
            onChangeValue={(value) => {
              if (touched.email)
                setFieldError("email", validateField("email", value));
            }}
            placeholder="voce@exemplo.com"
            type="email"
          />
        )}
        {(mode === "login" || mode === "signup" || mode === "reset") && (
          <PasswordField
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            error={fieldErrors.password}
            hint={mode === "signup" ? "Mínimo de 8 caracteres" : undefined}
            label={mode === "reset" ? "Nova senha" : "Senha"}
            onBlurValue={(value) => {
              setTouched((current) => ({ ...current, password: true }));
              setFieldError("password", validateField("password", value));
            }}
            onChangeValue={(value) => {
              if (touched.password) {
                setFieldError("password", validateField("password", value));
              }
            }}
            placeholder="Mínimo de 8 caracteres"
          />
        )}
        {message && (
          <p
            className={`auth-message${success ? " is-success" : ""}`}
            role={success ? "status" : "alert"}
          >
            {message}
            {existingAccount ? (
              <>
                {" "}
                <Link href="/login">Entrar</Link>
              </>
            ) : null}
          </p>
        )}
        <button
          aria-busy={loading === "form"}
          className="button button--primary button--full"
          disabled={busy}
          type="submit"
        >
          {loading === "form" ? (
            <span className="button-loader">
              <i />
              <i />
              <i />
              {loadingLabel(mode)}
            </span>
          ) : (
            actionLabel(mode, Boolean(params.get("token")))
          )}
        </button>
      </form>
      {mode === "signup" && (
        <p className="auth-terms">
          Ao criar sua conta, você concorda com os{" "}
          <Link href="/terms">Termos de Uso</Link> e a{" "}
          <Link href="/privacy">Política de Privacidade</Link>.
        </p>
      )}
      <AuthLinks mode={mode} success={success} />
    </section>
  );
}

function Field(
  props: InputHTMLAttributes<HTMLInputElement> & {
    error?: string | undefined;
    label: string;
    onBlurValue?: (value: string) => void;
    onChangeValue?: (value: string) => void;
  },
) {
  const generatedId = useId();
  const {
    error,
    id = generatedId,
    label,
    onBlurValue,
    onChangeValue,
    ...input
  } = props;
  const errorId = `${id}-error`;
  return (
    <div className={`form-field${error ? " is-invalid" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <input
        {...input}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        id={id}
        onBlur={(event) => onBlurValue?.(event.currentTarget.value)}
        onChange={(event) => onChangeValue?.(event.currentTarget.value)}
      />
      {error ? (
        <p className="form-field__error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PasswordField({
  autoComplete,
  error,
  hint,
  label,
  onBlurValue,
  onChangeValue,
  placeholder,
}: {
  autoComplete: string;
  error?: string | undefined;
  hint?: string | undefined;
  label: string;
  onBlurValue?: (value: string) => void;
  onChangeValue?: (value: string) => void;
  placeholder: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : "", hint ? hintId : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={`form-field${error ? " is-invalid" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="form-field__control">
        <input
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          autoComplete={autoComplete}
          id={id}
          name="password"
          onBlur={(event) => onBlurValue?.(event.currentTarget.value)}
          onChange={(event) => onChangeValue?.(event.currentTarget.value)}
          placeholder={placeholder}
          type={visible ? "text" : "password"}
        />
        <button
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          className="form-field__toggle"
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {hint && !error ? (
        <p className="form-field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="form-field__error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function AuthLinks({ mode, success }: { mode: Mode; success: boolean }) {
  if (mode === "login")
    return (
      <div className="auth-links">
        <Link href="/forgot-password">Esqueci minha senha</Link>
        <p>
          Ainda não tem conta? <Link href="/signup">Começar grátis</Link>
        </p>
      </div>
    );
  if (mode === "signup")
    return (
      <div className="auth-links">
        <p>
          Já tem uma conta? <Link href="/login">Entrar</Link>
        </p>
      </div>
    );
  if (mode === "reset" && success)
    return (
      <div className="auth-links">
        <Link href="/login">Entrar com a nova senha</Link>
      </div>
    );
  return (
    <div className="auth-links">
      <Link href="/login">Voltar para o login</Link>
    </div>
  );
}

function actionLabel(mode: Mode, hasToken: boolean) {
  return {
    login: "Entrar",
    signup: "Criar conta",
    forgot: "Enviar link de recuperação",
    reset: "Redefinir senha",
    verify: hasToken ? "Confirmar email" : "Reenviar confirmação",
  }[mode];
}

function loadingLabel(mode: Mode) {
  return {
    login: "Entrando…",
    signup: "Criando conta…",
    forgot: "Enviando…",
    reset: "Redefinindo…",
    verify: "Aguarde…",
  }[mode];
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.09-1.92 3.27-4.76 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.98 0 5.48-.99 7.3-2.68l-3.58-2.77c-.99.66-2.26 1.06-3.72 1.06-2.88 0-5.32-1.95-6.19-4.57H2.12v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.81 14.04A6.6 6.6 0 0 1 5.47 12c0-.71.12-1.4.34-2.04V7.12H2.12A11 11 0 0 0 1 12c0 1.78.43 3.46 1.12 4.88l3.69-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.55 10.55 0 0 0 12 1 11 11 0 0 0 2.12 7.12l3.69 2.84C6.68 7.33 9.12 5.38 12 5.38Z"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M3 3l18 18M9.9 9.9A3 3 0 0 0 12 15a3 3 0 0 0 2.1-.9M6.1 6.4C3.8 8 2.5 12 2.5 12s3.5 7 9.5 7c2 0 3.7-.5 5.1-1.3M17.6 15.7C20 14 21.5 12 21.5 12s-3.5-7-9.5-7c-.9 0-1.8.1-2.6.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}
