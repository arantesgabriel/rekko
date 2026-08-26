import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const password = "Rekko-workspace-2026";

async function signUp(
  page: import("@playwright/test").Page,
  input: { email: string; name: string; next?: string },
) {
  await page.goto(
    `/signup${input.next ? `?next=${encodeURIComponent(input.next)}` : ""}`,
  );
  await page.getByLabel("Nome").fill(input.name);
  await page.getByLabel("Email").fill(input.email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Criar conta" }).click();
}

async function signOut(page: import("@playwright/test").Page) {
  const visibleSignOut = page
    .getByRole("button", { name: "Sair", exact: true })
    .filter({ visible: true });
  if ((await visibleSignOut.count()) === 0) {
    await page
      .locator("details")
      .filter({ hasText: "Conta" })
      .locator("summary")
      .click();
  }
  await page
    .getByRole("button", { name: "Sair", exact: true })
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL(/\/login/);
}

test("authenticated user creates and switches between two Workspaces", async ({
  page,
}, testInfo) => {
  const stamp = `${testInfo.project.name}-${Date.now()}`;
  await signUp(page, {
    email: `owner-switch-${stamp}@example.com`,
    name: "Owner Switch",
  });
  await expect(
    page.getByRole("heading", { name: "Onde seu tempo acontece?" }),
  ).toBeVisible();
  await page.getByLabel("Nome do Workspace").fill(`Workspace A ${stamp}`);
  await page.getByRole("button", { name: "Criar Workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Quer trazer seu time?" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Pular por agora" }).click();
  await expect(
    page.getByRole("heading", { name: "Seu Workspace está pronto." }),
  ).toBeVisible();
  let switcher = page.locator("details.workspace-switcher:visible");
  await switcher.getByLabel("Trocar Workspace").click();
  await switcher.getByRole("link", { name: "Criar Workspace" }).click();
  await page.getByLabel("Nome do Workspace").fill(`Workspace B ${stamp}`);
  await page.getByRole("button", { name: "Criar Workspace" }).click();
  await page.getByRole("link", { name: "Pular por agora" }).click();
  switcher = page.locator("details.workspace-switcher:visible");
  await switcher.getByLabel("Trocar Workspace").click();
  await switcher.getByRole("link", { name: `Workspace A ${stamp}` }).click();
  await expect(page).toHaveURL(/\/w\/workspace-a-/);
  await page.reload();
  await expect(page).toHaveURL(/\/w\/workspace-a-/);
});

test("Owner invites a user who signs up and joins; Member sees no admin form", async ({
  page,
  request,
}, testInfo) => {
  const stamp = `${testInfo.project.name}-${Date.now()}`;
  const ownerEmail = `owner-invite-${stamp}@example.com`;
  const memberEmail = `member-invite-${stamp}@example.com`;
  await signUp(page, { email: ownerEmail, name: "Owner Invite" });
  await page.getByLabel("Nome do Workspace").fill(`Secure Workspace ${stamp}`);
  await page.getByRole("button", { name: "Criar Workspace" }).click();
  await page.getByLabel("Email").fill(memberEmail);
  await page.getByLabel("Cargo").fill("Desenvolvedor Backend");
  await page.getByRole("button", { name: "Enviar convite" }).click();
  await expect(page.getByRole("status")).toContainText("Convite enviado");
  const mailbox = await request.get("/api/dev/mailbox");
  const payload = (await mailbox.json()) as {
    emails: { email: string; kind: string; url: string }[];
  };
  const email = payload.emails
    .toReversed()
    .find(
      (item) =>
        item.email === memberEmail && item.kind === "workspace-invitation",
    );
  expect(email).toBeDefined();
  const invitePath = new URL(email!.url).pathname;
  await signOut(page);
  await signUp(page, {
    email: memberEmail,
    name: "Member Invite",
    next: invitePath,
  });
  await expect(
    page.getByRole("heading", {
      name: new RegExp(`Entre em Secure Workspace`),
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Aceitar convite" }).click();
  await expect(
    page.getByRole("heading", { name: "Seu Workspace está pronto." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Members" }).first().click();
  await expect(page.getByRole("heading", { name: "Members" })).toBeVisible();
  const membersUrl = page.url();
  const membersPath = new URL(membersUrl).pathname;
  await expect(
    page.getByRole("heading", { name: "Convidar pessoa" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Remover" })).toHaveCount(0);
  await signOut(page);
  await page.goto(`/login?next=${encodeURIComponent(membersPath)}`);
  await page.getByLabel("Email").fill(ownerEmail);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(membersPath);
  const memberRow = page
    .locator("article.member-row")
    .filter({ hasText: memberEmail });
  await memberRow.getByLabel("Role de Member Invite").selectOption("ADMIN");
  await memberRow.getByRole("button", { name: "Salvar" }).last().click();
  await expect(page.getByRole("status")).toContainText("Role atualizada");
});

test("mobile onboarding fits 390 by 844 without horizontal scroll", async ({
  page,
}, testInfo) => {
  const stamp = `${testInfo.project.name}-${Date.now()}`;
  await page.setViewportSize({ width: 390, height: 844 });
  await signUp(page, {
    email: `mobile-workspace-${stamp}@example.com`,
    name: "Mobile Owner",
  });
  await expect(
    page.getByRole("heading", { name: "Onde seu tempo acontece?" }),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await page.getByLabel("Nome do Workspace").fill(`Mobile Workspace ${stamp}`);
  await page.getByRole("button", { name: "Criar Workspace" }).click();
  const skip = page.getByRole("link", { name: "Pular por agora" });
  await skip.scrollIntoViewIfNeeded();
  await expect(skip).toBeVisible();
  const inviteOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(inviteOverflow).toBeLessThanOrEqual(0);
});
