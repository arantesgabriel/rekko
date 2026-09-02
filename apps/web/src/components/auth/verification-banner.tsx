import Link from "next/link";
import { parseServerEnv } from "@rekko/shared/env";

import { getVerificationAccess } from "@/modules/auth/grace-period";

export function VerificationBanner({
  user,
}: {
  user: { createdAt: Date; email: string; emailVerified: boolean };
}) {
  const env = parseServerEnv(process.env);
  const now = new Date();
  const access = getVerificationAccess({
    createdAt: user.createdAt,
    emailVerified: user.emailVerified,
    graceHours: env.EMAIL_VERIFICATION_GRACE_HOURS,
    now,
  });
  if (access !== "allowed") return null;
  return (
    <aside className="verification-banner verification-banner--product">
      <div>
        <strong>Confirme seu e-mail</strong>
        <span>
          Confirme seu e-mail para continuar usando todos os recursos do Rekko.
        </span>
      </div>
      <Link
        className="button button--secondary button--sm"
        href={`/verify-email?email=${encodeURIComponent(user.email)}`}
      >
        Reenviar
      </Link>
    </aside>
  );
}
