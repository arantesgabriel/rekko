export type VerificationAccess = "allowed" | "blocked" | "verified";

export function getVerificationAccess(input: {
  createdAt: Date;
  emailVerified: boolean;
  graceHours: number;
  now: Date;
}): VerificationAccess {
  if (input.emailVerified) return "verified";
  const elapsed = input.now.getTime() - input.createdAt.getTime();
  return elapsed < input.graceHours * 60 * 60 * 1000 ? "allowed" : "blocked";
}

export function getGraceHoursRemaining(input: {
  createdAt: Date;
  graceHours: number;
  now: Date;
}) {
  const deadline =
    input.createdAt.getTime() + input.graceHours * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((deadline - input.now.getTime()) / 3_600_000));
}
