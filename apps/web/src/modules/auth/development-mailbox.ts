type DevelopmentEmail = {
  email: string;
  kind: "password-reset" | "verification" | "workspace-invitation";
  url: string;
};

const mailboxKey = Symbol.for("rekko.development-mailbox");
const globalMailbox = globalThis as typeof globalThis & {
  [mailboxKey]?: DevelopmentEmail[];
};

export function storeDevelopmentEmail(email: DevelopmentEmail) {
  const mailbox = (globalMailbox[mailboxKey] ??= []);
  mailbox.push(email);
  if (mailbox.length > 50) mailbox.shift();
}

export function listDevelopmentEmails() {
  return [...(globalMailbox[mailboxKey] ?? [])];
}
