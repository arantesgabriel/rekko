import Link from "next/link";
import { parseServerEnv } from "@rekko/shared/env";

import {
  getGraceHoursRemaining,
  getVerificationAccess,
} from "@/modules/auth/grace-period";

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
  const hours = getGraceHoursRemaining({
    createdAt: user.createdAt,
    graceHours: env.EMAIL_VERIFICATION_GRACE_HOURS,
    now,
  });
  return (
    <aside className="verification-banner verification-banner--product">
      <div>
        <strong>
          Confirme seu e-mail nos próximos{" "}
          {hours <= 24 ? `${hours} horas` : `${Math.ceil(hours / 24)} dias`}.
        </strong>
        <span>Assim você continua usando o Rekko sem interrupções.</span>
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
