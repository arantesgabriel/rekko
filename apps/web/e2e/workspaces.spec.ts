import { expect, test } from "@playwright/test";

const password = "Rekko-workspace-2026";
const responsiveViewports = [
  { width: 1920, height: 1080 },
  { width: 1600, height: 900 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 430, height: 932 },
  { width: 390, height: 844 },
  { width: 375, height: 812 },
] as const;

async function expectNoHorizontalOverflow(
  page: import("@playwright/test").Page,
) {
  for (const viewport of responsiveViewports) {
    await page.setViewportSize(viewport);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(
      overflow,
      `${viewport.width}×${viewport.height}`,
    ).toBeLessThanOrEqual(0);
  }
}

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
      .locator("details.app-account-menu, details.onboarding-account-menu")
      .filter({ visible: true })
      .locator("summary")
      .click();
  }
  await page
    .getByRole("button", { name: "Sair", exact: true })
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL(/\/login/);
}

async function completeOnboarding(
  page: import("@playwright/test").Page,
  input: {
    invitation?: {
      email: string;
      jobTitle?: string;
      role?: "ADMIN" | "MEMBER";
    };
    workspaceName: string;
  },
) {
  await page.getByLabel("Nome do workspace").fill(input.workspaceName);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Quer trazer seu time?" }),
  ).toBeVisible();
  if (input.invitation) {
    await page.getByLabel("E-mail").fill(input.invitation.email);
    await page
      .getByLabel("Permissão")
      .selectOption(input.invitation.role ?? "MEMBER");
    if (input.invitation.jobTitle) {
      await page.getByLabel("Cargo").fill(input.invitation.jobTitle);
    }
    await page.getByRole("button", { name: "Adicionar convite" }).click();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
  } else {
    await page
      .getByRole("button", { name: "Continuar sem trazer ninguém" })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Tudo certo por aqui?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Criar workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Nenhum tempo registrado neste dia." }),
  ).toBeVisible();
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
  await completeOnboarding(page, { workspaceName: `Workspace A ${stamp}` });
  let switcher = page.locator("details.workspace-switcher:visible");
  await switcher.getByLabel("Trocar Workspace").click();
  await switcher.getByRole("link", { name: "Criar Workspace" }).click();
  await completeOnboarding(page, { workspaceName: `Workspace B ${stamp}` });
  switcher = page.locator("details.workspace-switcher:visible");
  await switcher.getByLabel("Trocar Workspace").click();
  await switcher.getByRole("link", { name: `Workspace A ${stamp}` }).click();
  await expect(page).toHaveURL(/\/w\/workspace-a-/);
  await page.reload();
  await expect(page).toHaveURL(/\/w\/workspace-a-/);
});

test("Owner connects Linear and selectively imports a parent tree", async ({
  page,
}, testInfo) => {
  const stamp = `${testInfo.project.name}-${Date.now()}`;
  await signUp(page, {
    email: `linear-owner-${stamp}@example.com`,
    name: "Linear Owner",
  });
  await completeOnboarding(page, { workspaceName: `Linear ${stamp}` });
  const integrationsLink = page
    .getByRole("link", { name: "Integrações" })
    .first();
  if (!(await integrationsLink.isVisible()))
    await page.getByRole("button", { name: "Abrir menu" }).click();
  await integrationsLink.click();
  await page.getByRole("button", { name: "Conectar Linear" }).click();
  await expect(page.getByText("Linear conectado.")).toBeVisible();
  const workLink = page.getByRole("link", { name: "Projetos" }).first();
  if (!(await workLink.isVisible()))
    await page.getByRole("button", { name: "Abrir menu" }).click();
  await workLink.click();
  await page.getByRole("link", { name: "Criar projeto" }).first().click();
  await page.getByRole("link", { name: "Criar com Linear" }).click();
  await page.getByLabel("Nome do projeto").fill("Projeto Linear seletivo");
  const parent = page.getByLabel(/LIN-100/);
  await parent.check();
  await expect(page.getByLabel(/LIN-101/)).toBeChecked();
  await expect(page.getByLabel(/LIN-102/)).toBeChecked();
  await page.getByLabel(/LIN-102/).uncheck();
  await expect(parent).toHaveJSProperty("indeterminate", true);
  await page.getByRole("button", { name: "Importar selecionados" }).click();
  await expect(
    page.getByRole("heading", { name: "Projeto Linear seletivo" }),
  ).toBeVisible();
  await expect(page.getByText("LIN-102")).toHaveCount(0);
  await expect(page.getByText("Linear", { exact: true }).first()).toBeVisible();
});

test("Owner invites a user who signs up and joins; Member sees no admin form", async ({
  page,
  request,
}, testInfo) => {
  test.setTimeout(60_000);
  const stamp = `${testInfo.project.name}-${Date.now()}`;
  const ownerEmail = `owner-invite-${stamp}@example.com`;
  const memberEmail = `member-invite-${stamp}@example.com`;
  await signUp(page, { email: ownerEmail, name: "Owner Invite" });
  await completeOnboarding(page, {
    invitation: { email: memberEmail, jobTitle: "Desenvolvedor Backend" },
    workspaceName: `Secure Workspace ${stamp}`,
  });
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
    page.getByRole("heading", { name: "Nenhum tempo registrado neste dia." }),
  ).toBeVisible();
  const membersLink = page.getByRole("link", { name: "Membros" }).first();
  if (!(await membersLink.isVisible())) {
    await page.getByRole("button", { name: "Abrir menu" }).click();
  }
  await membersLink.click();
  await expect(page.getByRole("heading", { name: "Membros" })).toBeVisible();
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
    .locator("article.member-row:visible")
    .filter({ hasText: memberEmail });
  const memberCard = page
    .locator("article.member-card:visible")
    .filter({ hasText: memberEmail });
  const membersList = page.locator(".members-list");
  const success = page.getByText("Permissão atualizada.");
  if ((page.viewportSize()?.width ?? 1024) < 768) {
    await memberCard.locator("details.member-card__edit > summary").click();
    await memberCard.getByLabel("Permissão").selectOption("ADMIN");
  } else {
    await memberRow
      .getByLabel("Permissão de Member Invite")
      .selectOption("ADMIN");
  }
  await expect
    .poll(
      async () =>
        (await success.isVisible()) ||
        (await membersList.getAttribute("aria-busy")) === "true",
    )
    .toBe(true);
  await expect(membersList).toHaveAttribute("aria-busy", "false");
  await page.reload();
  const visibleMemberCard = page
    .locator("article.member-card:visible")
    .filter({ hasText: memberEmail });
  if ((page.viewportSize()?.width ?? 1024) < 768) {
    await visibleMemberCard
      .locator("details.member-card__edit > summary")
      .click();
    await expect(visibleMemberCard.getByLabel("Permissão")).toHaveValue(
      "ADMIN",
    );
  } else {
    await expect(
      page
        .locator("article.member-row:visible")
        .filter({ hasText: memberEmail })
        .getByLabel("Permissão de Member Invite"),
    ).toHaveValue("ADMIN");
  }
});

test("mobile onboarding fits 390 by 844 without horizontal scroll", async ({
  page,
}, testInfo) => {
  const stamp = `${testInfo.project.name}-${Date.now()}`;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await signUp(page, {
    email: `mobile-workspace-${stamp}@example.com`,
    name: "Mobile Owner",
  });
  await expect(
    page.getByRole("heading", { name: "Onde seu tempo acontece?" }),
  ).toBeVisible();
  await expect(page.getByLabel("Nome do workspace")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Continuar", exact: true }),
  ).toBeFocused();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await page.getByLabel("Nome do workspace").fill(`Mobile Workspace ${stamp}`);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator(".onboarding-stage")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(
    page.getByRole("button", { name: "Continuar sem trazer ninguém" }),
  ).toBeVisible();
  await expect(page.getByText(/Etapa \d de 3/)).toHaveCount(0);
  const inviteOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(inviteOverflow).toBeLessThanOrEqual(0);
});

test("onboarding preserves edits and sends no invitation before confirmation", async ({
  page,
  request,
}, testInfo) => {
  const stamp = `${testInfo.project.name}-${Date.now()}`;
  const invitedEmail = `draft-invite-${stamp}@example.com`;
  await signUp(page, {
    email: `draft-owner-${stamp}@example.com`,
    name: "Draft Owner",
  });
  await page.getByLabel("Nome do workspace").fill(`Draft ${stamp}`);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("E-mail").fill(invitedEmail);
  await page.getByLabel("Cargo").fill("Tech Lead");
  await page.getByRole("button", { name: "Adicionar convite" }).click();

  const mailboxBefore = await request.get("/api/dev/mailbox");
  const beforePayload = (await mailboxBefore.json()) as {
    emails: { email: string; kind: string }[];
  };
  expect(
    beforePayload.emails.some(
      (email) =>
        email.email === invitedEmail && email.kind === "workspace-invitation",
    ),
  ).toBe(false);

  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("region", { name: "Workspace" })
    .getByRole("button", { name: "Editar" })
    .click();
  await expect(page.getByLabel("Nome do workspace")).toHaveValue(
    `Draft ${stamp}`,
  );
  await page.getByLabel("Nome do workspace").fill(`Edited ${stamp}`);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByText(invitedEmail)).toBeVisible();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.getByText(`Edited ${stamp}`)).toBeVisible();
  await page.getByRole("button", { name: "Criar workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Nenhum tempo registrado neste dia." }),
  ).toBeVisible();
});

test("Owner creates a manual Project, Work Items, hierarchy and filters", async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  const stamp = `${testInfo.project.name}-${Date.now()}`;
  await signUp(page, {
    email: `owner-project-${stamp}@example.com`,
    name: "Owner Project",
  });
  await completeOnboarding(page, { workspaceName: `Work ${stamp}` });
  const projectsLink = page.getByRole("link", { name: "Projetos" }).first();
  if (!(await projectsLink.isVisible())) {
    await page.getByRole("button", { name: "Abrir menu" }).click();
  }
  await projectsLink.click();
  await page.getByRole("link", { name: "Criar projeto" }).first().click();
  await page.getByRole("link", { name: "Criar manualmente" }).click();
  await page.getByLabel("Nome *").fill("AMBLA");
  await page.getByLabel("Descrição").fill("Projeto manual de teste");
  await page.getByLabel("Estimativa total").fill("40h");
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page.getByRole("heading", { name: "AMBLA" })).toBeVisible();
  await page.locator("summary").filter({ hasText: "Criar demanda" }).click();
  const createItem = page.locator("details.create-item");
  await createItem.getByLabel("Título *").fill("Authentication");
  await createItem.getByLabel("Estimativa", { exact: true }).fill("2h");
  await createItem
    .getByRole("button", { name: "Criar demanda", exact: true })
    .click();
  await expect(page.getByText("Demanda criada.")).toBeVisible();
  await createItem.getByLabel("Título *").fill("Google login");
  await createItem
    .getByLabel("Demanda principal")
    .selectOption({ label: "Authentication" });
  await createItem
    .getByRole("button", { name: "Criar demanda", exact: true })
    .click();
  const rowNamed = (name: string) =>
    page.locator("article.work-item-row").filter({
      has: page
        .locator(".work-item-row__main > strong")
        .filter({ hasText: new RegExp(`^${name}$`) }),
    });
  await expect(rowNamed("Google login")).toBeVisible();
  await createItem.evaluate((details: HTMLDetailsElement) => {
    details.open = false;
  });
  const authentication = rowNamed("Authentication");
  await authentication.getByRole("button", { name: "Iniciar" }).click();
  await expect(
    page.getByRole("complementary", { name: "Timer atual" }),
  ).toContainText("Authentication");
  await page.getByRole("button", { name: "Pausar" }).click();
  await expect(
    page.getByRole("complementary", { name: "Timer atual" }),
  ).toContainText("Pausado");
  await page.reload();
  await expect(page.getByRole("button", { name: "Retomar" })).toBeVisible();
  await page.getByRole("button", { name: "Retomar" }).click();
  const googleLogin = rowNamed("Google login");
  await googleLogin.getByRole("button", { name: "Trocar" }).click();
  await expect(
    page.getByRole("complementary", { name: "Timer atual" }),
  ).toContainText("Google login");
  const mobileTimerMenu = page.locator("details.timer-switcher--mobile");
  if ((page.viewportSize()?.width ?? 1024) < 768) {
    await mobileTimerMenu.locator("summary").click();
    await mobileTimerMenu
      .getByRole("button", { name: "Encerrar timer" })
      .click();
  } else {
    await page.getByRole("button", { name: "Encerrar" }).click();
  }
  await expect(
    page.getByRole("complementary", { name: "Timer atual" }),
  ).toHaveCount(0);
  await page.getByPlaceholder("Buscar por título…").fill("Google");
  await expect(page).toHaveURL(/q=Google/);
  await expect(rowNamed("Google login")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page
    .locator("details.app-account-menu > summary")
    .filter({ visible: true })
    .click();
  await page
    .getByRole("button", { name: "Usar tema escuro" })
    .filter({ visible: true })
    .click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  const darkOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(darkOverflow).toBeLessThanOrEqual(0);

  const projectPath = new URL(page.url()).pathname;
  const workspaceHome = projectPath.replace(/\/projects\/[^/]+$/, "");
  await page.goto(workspaceHome);
  await page.getByRole("button", { name: "Adicionar tempo" }).first().click();
  await page.getByLabel("Início").fill("08:00");
  await page.getByLabel("Fim").fill("09:00");
  await page
    .locator('select[name="projectId"]')
    .selectOption({ label: "AMBLA" });
  await page
    .locator('select[name="workItemId"]')
    .selectOption({ label: "Authentication" });
  await page
    .locator('textarea[name="description"]')
    .fill("Planejamento manual");
  await page.getByRole("button", { name: "Salvar tempo" }).click();
  await expect(
    page
      .locator(".timeline-block")
      .filter({ hasText: "Authentication" })
      .first(),
  ).toBeVisible();
  await expect(page.getByText("1h").first()).toBeVisible();

  await page.getByRole("button", { name: "Adicionar tempo" }).click();
  await page.getByLabel("Início").fill("08:30");
  await page.getByLabel("Fim").fill("09:30");
  await page
    .locator('select[name="projectId"]')
    .selectOption({ label: "AMBLA" });
  await page.getByRole("button", { name: "Salvar tempo" }).click();
  await expect(
    page.getByText("Parte deste período já possui tempo registrado."),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
