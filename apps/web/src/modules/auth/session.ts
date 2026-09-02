import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { parseServerEnv } from "@rekko/shared/env";

import { auth } from "./auth";
import { getVerificationAccess } from "./grace-period";

export async function requireSession(next = "/app") {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  return session;
}

export async function requireCoreSession(next = "/app") {
  const session = await requireSession(next);
  if (!(await hasCoreAccess(session))) redirect("/app?verification=required");
  return session;
}

export async function getCoreSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !(await hasCoreAccess(session))) return null;
  return session;
}

async function hasCoreAccess(
  session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>,
) {
  const env = parseServerEnv(process.env);
  const access = getVerificationAccess({
    createdAt: session.user.createdAt,
    emailVerified: session.user.emailVerified,
    graceHours: env.EMAIL_VERIFICATION_GRACE_HOURS,
    now: new Date(),
  });
  return access !== "blocked";
}
