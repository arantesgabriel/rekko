import { Resend } from "resend";

import { logger } from "@/lib/logger";

export interface EmailService {
  sendPasswordReset(input: {
    email: string;
    name: string;
    url: string;
  }): Promise<void>;
  sendVerification(input: {
    email: string;
    name: string;
    url: string;
  }): Promise<void>;
}

export function createEmailService(config: {
  apiKey: string | undefined;
  from: string;
  production: boolean;
}): EmailService {
  if (!config.production || !config.apiKey)
    return new DevelopmentEmailService();
  return new ResendEmailService(new Resend(config.apiKey), config.from);
}

class DevelopmentEmailService implements EmailService {
  async sendPasswordReset(input: { email: string; name: string; url: string }) {
    logger.info(
      {
        module: "auth",
        operation: "development_password_reset",
        email: input.email,
        url: input.url,
      },
      "Development email link",
    );
  }
  async sendVerification(input: { email: string; name: string; url: string }) {
    logger.info(
      {
        module: "auth",
        operation: "development_email_verification",
        email: input.email,
        url: input.url,
      },
      "Development email link",
    );
  }
}

class ResendEmailService implements EmailService {
  constructor(
    private readonly resend: Resend,
    private readonly from: string,
  ) {}
  async sendPasswordReset(input: { email: string; name: string; url: string }) {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: input.email,
      subject: "Redefina sua senha do Rekko",
      html: authEmail(
        input.name,
        "Redefina sua senha",
        "Recebemos um pedido para criar uma nova senha. O link expira em 1 hora e só pode ser usado uma vez.",
        "Criar nova senha",
        input.url,
      ),
    });
    if (error)
      throw new Error("Transactional email delivery failed", { cause: error });
  }
  async sendVerification(input: { email: string; name: string; url: string }) {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: input.email,
      subject: "Confirme seu email no Rekko",
      html: authEmail(
        input.name,
        "Confirme seu email",
        "Confirme seu endereço para continuar usando o Rekko sem interrupções. Você pode acessar sua conta durante os primeiros 3 dias.",
        "Confirmar email",
        input.url,
      ),
    });
    if (error)
      throw new Error("Transactional email delivery failed", { cause: error });
  }
}

function authEmail(
  name: string,
  title: string,
  copy: string,
  action: string,
  url: string,
) {
  return `<div style="font-family:Manrope,Arial,sans-serif;color:#181821;max-width:560px;margin:auto;padding:40px"><p style="color:#6857F5;font-weight:800">rekko</p><h1 style="font-size:28px">${title}</h1><p>Olá, ${escapeHtml(name)}.</p><p style="line-height:1.6;color:#5E6172">${copy}</p><p style="margin:32px 0"><a href="${url}" style="background:#6857F5;color:white;text-decoration:none;padding:13px 20px;border-radius:11px;font-weight:700">${action}</a></p><p style="font-size:12px;color:#8D91A1">Se você não solicitou esta mensagem, pode ignorá-la.</p></div>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
