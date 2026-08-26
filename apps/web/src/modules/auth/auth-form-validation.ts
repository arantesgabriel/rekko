const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuthName(value: string) {
  if (!value.trim()) return "Informe seu nome.";
  return "";
}

export function validateAuthEmail(value: string) {
  const email = value.trim();
  if (!email) return "Informe seu email.";
  if (!emailPattern.test(email)) return "Informe um email válido.";
  return "";
}

export function validateAuthPassword(value: string) {
  if (!value) return "Informe sua senha.";
  if (value.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
  return "";
}

export function isLikelyNetworkError(error: unknown) {
  if (error instanceof TypeError) return true;
  const message = error instanceof Error ? error.message : String(error);
  return /failed to fetch|network|load failed|offline/i.test(message);
}

export function mapAuthApiError(input: {
  code?: string | null | undefined;
  message?: string | null | undefined;
  status?: number | null | undefined;
  kind?: string | null | undefined;
}) {
  const code = (input.code ?? "").toUpperCase();
  const message = (input.message ?? "").toLowerCase();
  const status = input.status ?? 0;

  if (
    status === 429 ||
    code.includes("TOO_MANY") ||
    /rate limit|too many/.test(message)
  ) {
    return "Muitas tentativas. Aguarde um momento e tente novamente.";
  }
  if (
    input.kind === "CREDENTIALS" ||
    code.includes("INVALID") ||
    /invalid email or password|invalid credentials/.test(message)
  ) {
    return "Email ou senha incorretos.";
  }
  if (
    input.kind === "EXISTS" ||
    code.includes("USER_ALREADY") ||
    /already exists|already registered|user already/.test(message)
  ) {
    return "EXISTS";
  }
  if (input.kind === "TOKEN") {
    return "Este link é inválido ou expirou. Solicite um novo.";
  }
  if (input.kind === "OAUTH") {
    return "Não foi possível continuar com o Google. Tente novamente.";
  }
  return "Não foi possível concluir agora. Tente novamente em instantes.";
}
