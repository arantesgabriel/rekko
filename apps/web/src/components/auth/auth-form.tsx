"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { authClient } from "@/modules/auth/auth-client";

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

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    params.get("error")
      ? "Não conseguimos concluir esta ação. Tente novamente."
      : "",
  );
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    try {
      if (mode === "login") {
        const result = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/app",
        });
        if (result.error) throw new Error("CREDENTIALS");
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
        if (result.error) throw new Error("SIGNUP");
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
      const kind = error instanceof Error ? error.message : "SERVER";
      setMessage(
        kind === "CREDENTIALS"
          ? "Email ou senha inválidos."
          : kind === "TOKEN"
            ? "Este link é inválido ou expirou. Solicite um novo."
            : "Não conseguimos concluir agora. Tente novamente em instantes.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setLoading(true);
    setMessage("");
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/app",
      errorCallbackURL: "/login?error=oauth",
    });
    if (result.error) {
      setMessage("Não conseguimos iniciar o acesso com Google.");
      setLoading(false);
    }
  }

  const [title, description] = content[mode];
  return (
    <section className="auth-card" aria-labelledby="auth-title">
      <div className="auth-card__heading">
        <h1 id="auth-title">{title}</h1>
        <p>{description}</p>
      </div>
      {(mode === "login" || mode === "signup") && (
        <>
          <button
            className="google-button"
            disabled={loading}
            onClick={google}
            type="button"
          >
            <GoogleIcon />
            Continuar com Google
          </button>
          <div className="auth-divider">
            <span>ou continue com email</span>
          </div>
        </>
      )}
      <form onSubmit={submit}>
        {mode === "signup" && (
          <Field
            autoComplete="name"
            label="Nome"
            name="name"
            placeholder="Como podemos chamar você?"
            required
          />
        )}
        {mode !== "reset" && (
          <Field
            autoComplete="email"
            label="Email"
            name="email"
            placeholder="voce@exemplo.com"
            required
            type="email"
          />
        )}
        {(mode === "login" || mode === "signup" || mode === "reset") && (
          <Field
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            label={mode === "reset" ? "Nova senha" : "Senha"}
            minLength={8}
            name="password"
            placeholder="Mínimo de 8 caracteres"
            required
            type="password"
          />
        )}
        {message && (
          <p
            className={`auth-message${success ? " is-success" : ""}`}
            role="status"
          >
            {message}
          </p>
        )}
        <button
          className="button button--primary button--full"
          disabled={loading}
          type="submit"
        >
          {loading ? (
            <span className="button-loader" aria-label="Aguarde">
              <i />
              <i />
              <i />
            </span>
          ) : (
            actionLabel(mode, Boolean(params.get("token")))
          )}
        </button>
      </form>
      <AuthLinks mode={mode} success={success} />
    </section>
  );
}

function Field(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label: string },
) {
  const { label, ...input } = props;
  return (
    <label className="form-field">
      <span>{label}</span>
      <input {...input} />
    </label>
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
