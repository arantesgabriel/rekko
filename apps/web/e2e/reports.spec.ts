import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const password = "Rekko-reports-2026";

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

async function openMobileDisclosure(
  page: import("@playwright/test").Page,
  selector: string,
) {
  const summary = page
    .locator(`${selector} > summary`)
    .filter({ visible: true })
    .first();
  if ((page.viewportSize()?.width ?? 1024) < 768) await summary.click();
}

async function openInviteForm(page: import("@playwright/test").Page) {
  if ((page.viewportSize()?.width ?? 1024) < 768) {
    await page.locator("details.invite-disclosure > summary").click();
    return page.locator(".invite-section--mobile form.invite-form");
  }
  return page.locator(".invite-section--desktop form.invite-form");
}

async function completeOnboarding(
  page: import("@playwright/test").Page,
  workspaceName: string,
) {
  await page.getByLabel("Nome do workspace").fill(workspaceName);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("button", { name: "Continuar sem trazer ninguém" })
    .click();
  await page.getByRole("button", { name: "Criar workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Nenhum tempo registrado neste dia." }),
  ).toBeVisible();
}

async function signOut(page: import("@playwright/test").Page) {
  const menu = page.locator("details.app-account-menu:visible");
  await menu.locator("summary").click();
  await menu.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
}

async function createProject(
  page: import("@playwright/test").Page,
  projectName: string,
) {
  const workspacePath = new URL(page.url()).pathname;
  await page.goto(`${workspacePath}/projects`);
  await page
    .getByRole("button", { name: "Criar projeto", exact: true })
    .first()
    .click();
  await page.getByLabel("Nome *").fill(projectName);
  await page
    .locator(".drawer-form__footer")
    .getByRole("button", { name: "Criar projeto", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
}

async function addManualTime(
  page: import("@playwright/test").Page,
  projectName: string,
  start: string,
  end: string,
  workItemName: string,
) {
  const workspacePath = workspaceRoot(page);
  await page.goto(workspacePath);
  await page.getByRole("button", { name: "Adicionar tempo" }).first().click();
  await page.getByLabel("Início").fill(start);
  await page.getByLabel("Fim").fill(end);
  await page
    .locator('select[name="projectId"]')
    .selectOption({ label: projectName });
  await page.locator('select[name="workItemId"]').selectOption({
    label: workItemName,
  });
  await page.getByRole("button", { name: "Salvar tempo" }).click();
  await expect(page.locator(".time-drawer")).toHaveCount(0);
  await expect(page.locator(".timeline-block").first()).toBeVisible();
}

async function createDemand(
  page: import("@playwright/test").Page,
  projectName: string,
  demandName: string,
) {
  const workspacePath = workspaceRoot(page);
  await page.goto(`${workspacePath}/work`);
  await page.getByRole("button", { name: "Nova demanda", exact: true }).click();
  await page.getByLabel("Projeto *").selectOption({ label: projectName });
  await page.getByLabel("Título *").fill(demandName);
  await page
    .locator(".drawer-form__footer")
    .getByRole("button", { name: "Criar demanda", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: demandName, exact: true }),
  ).toBeVisible();
}

function workspaceRoot(page: import("@playwright/test").Page) {
  const match = new URL(page.url()).pathname.match(/^\/w\/[^/]+/);
  if (!match) throw new Error("Workspace URL not found");
  return match[0];
}

test("Owner reviews Workspace hours and downloads a UTF-8 CSV", async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  const stamp = `${testInfo.project.name}-${Date.now()}`;
  const projectName = `CSV Project ${stamp}`;
  const demandName = `CSV Demand ${stamp}`;
  await signUp(page, {
    email: `reports-owner-${stamp}@example.com`,
    name: "Reports Owner",
  });
  await completeOnboarding(page, `Reports ${stamp}`);
  const workspacePath = new URL(page.url()).pathname;
  await createProject(page, projectName);
  await createDemand(page, projectName, demandName);
  await addManualTime(page, projectName, "08:00", "09:30", demandName);

  await page.goto(`${workspacePath}/reports`);
  await expect(page.getByRole("heading", { name: "Relatórios" })).toBeVisible();
  await openMobileDisclosure(page, "details.reports-filter-disclosure");
  await expect(page.getByLabel("Colaborador")).toBeVisible();
  await expect(
    page.locator(".reports-table tbody tr").filter({ hasText: projectName }),
  ).toHaveCount(1);
  await expect(
    page.getByText("01:30", { exact: true }).filter({ visible: true }),
  ).toHaveCount(1);
  const today = new Date().toISOString().slice(0, 10);
  await page.getByLabel("Período").selectOption("custom");
  await expect(page.locator('input[name="start"]')).toBeVisible();
  await page.locator('input[name="start"]').fill(today);
  await page.locator('input[name="end"]').fill(today);
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(/period=custom/);
  await expect(
    page.getByText("01:30", { exact: true }).filter({ visible: true }),
  ).toHaveCount(1);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Exportar CSV" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^rekko-hours-.*\.csv$/);
  const csv = await readFile((await download.path())!);
  expect(csv.subarray(0, 3).toString("hex")).toBe("efbbbf");
  expect(csv.toString("utf8")).toContain('"Data";"Colaborador"');
  expect(csv.toString("utf8")).toContain(projectName);

  const accountMenu = page.locator("details.app-account-menu:visible");
  await accountMenu.locator("summary").click();
  await accountMenu.getByRole("button", { name: "Usar tema escuro" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator(".reports-page")).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await openMobileDisclosure(page, "details.reports-filter-disclosure");
  await expect(
    page.locator(".reports-mobile-list").filter({ visible: true }),
  ).toHaveCount(1);
  await expect(
    page.locator(".reports-table-wrap").filter({ visible: true }),
  ).toHaveCount(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  const visiblePeriod = page
    .locator('select[name="period"]')
    .filter({ visible: true });
  await expect(visiblePeriod).toHaveCount(1);
  await visiblePeriod.focus();
  await expect(visiblePeriod).toBeFocused();
});

test("Member sees only their own hours while Owner sees the full Workspace", async ({
  page,
  request,
}, testInfo) => {
  test.setTimeout(90_000);
  const stamp = `${testInfo.project.name}-${Date.now()}`;
  const ownerEmail = `reports-owner-member-${stamp}@example.com`;
  const memberEmail = `reports-member-${stamp}@example.com`;
  const projectName = `Shared Reports ${stamp}`;
  const demandName = `Shared Demand ${stamp}`;
  await signUp(page, { email: ownerEmail, name: "Reports Owner" });
  await completeOnboarding(page, `Shared Reports ${stamp}`);
  const workspacePath = new URL(page.url()).pathname;

  await page.goto(`${workspacePath}/projects`);
  await page
    .getByRole("button", { name: "Criar projeto", exact: true })
    .first()
    .click();
  await page.getByLabel("Nome *").fill(projectName);
  await page
    .locator(".drawer-form__footer")
    .getByRole("button", { name: "Criar projeto", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
  await createDemand(page, projectName, demandName);
  await addManualTime(page, projectName, "08:00", "09:00", demandName);

  await page.goto(`${workspacePath}/members`);
  await page.getByRole("heading", { name: "Membros" }).waitFor();
  const inviteForm = await openInviteForm(page);
  await inviteForm.waitFor();
  await inviteForm.getByLabel("E-mail").fill(memberEmail);
  await inviteForm.getByLabel("Cargo").fill("Relatórios");
  await inviteForm.getByRole("button", { name: "Enviar convite" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: /Convite/ }),
  ).toBeVisible();
  const mailbox = await request.get("/api/dev/mailbox");
  const payload = (await mailbox.json()) as {
    emails: { email: string; kind: string; url: string }[];
  };
  const invitation = payload.emails
    .toReversed()
    .find(
      (email) =>
        email.email === memberEmail && email.kind === "workspace-invitation",
    );
  expect(invitation).toBeDefined();
  const invitePath = new URL(invitation!.url).pathname;

  await signOut(page);
  await signUp(page, {
    email: memberEmail,
    name: "Reports Member",
    next: invitePath,
  });
  await expect(
    page.getByRole("button", { name: "Aceitar convite" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Aceitar convite" }).click();
  await expect(
    page.getByRole("heading", { name: "Nenhum tempo registrado neste dia." }),
  ).toBeVisible();
  await addManualTime(page, projectName, "06:00", "06:30", demandName);

  await page.goto(`${workspacePath}/reports`);
  await expect(page.getByRole("heading", { name: "Relatórios" })).toBeVisible();
  await expect(page.getByLabel("Colaborador")).toHaveCount(0);
  await expect(page.locator(".reports-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".reports-table tbody tr")).toContainText(
    "Reports Member",
  );
  const [memberDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Exportar CSV" }).click(),
  ]);
  const memberCsv = await readFile((await memberDownload.path())!);
  expect(memberCsv.subarray(0, 3).toString("hex")).toBe("efbbbf");
  expect(memberCsv.toString("utf8")).toContain("Reports Member");
  expect(memberCsv.toString("utf8")).not.toContain(ownerEmail);

  await signOut(page);
  await page.goto(
    `/login?next=${encodeURIComponent(`${workspacePath}/reports`)}`,
  );
  await page.getByLabel("Email").fill(ownerEmail);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(`${workspacePath}/reports`);
  await expect(page.locator(".reports-table tbody tr")).toHaveCount(2);
  await openMobileDisclosure(page, "details.reports-filter-disclosure");
  await expect(page.getByLabel("Colaborador")).toBeVisible();
});

test("Admin can review and export Workspace hours", async ({
  page,
  request,
}, testInfo) => {
  test.setTimeout(90_000);
  const stamp = `${testInfo.project.name}-${Date.now()}`;
  const ownerEmail = `reports-admin-owner-${stamp}@example.com`;
  const adminEmail = `reports-admin-${stamp}@example.com`;
  const projectName = `Admin Reports ${stamp}`;
  const demandName = `Admin Demand ${stamp}`;
  await signUp(page, { email: ownerEmail, name: "Reports Owner" });
  await completeOnboarding(page, `Admin Reports ${stamp}`);
  const workspacePath = new URL(page.url()).pathname;
  await createProject(page, projectName);
  await createDemand(page, projectName, demandName);
  await addManualTime(page, projectName, "08:00", "09:00", demandName);

  await page.goto(`${workspacePath}/members`);
  const inviteForm = await openInviteForm(page);
  await inviteForm.getByLabel("E-mail").fill(adminEmail);
  await inviteForm.getByLabel("Permissão").selectOption("ADMIN");
  await inviteForm.getByLabel("Cargo").fill("Administração");
  await inviteForm.getByRole("button", { name: "Enviar convite" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: /Convite/ }),
  ).toBeVisible();
  const mailbox = await request.get("/api/dev/mailbox");
  const payload = (await mailbox.json()) as {
    emails: { email: string; kind: string; url: string }[];
  };
  const invitation = payload.emails
    .toReversed()
    .find(
      (email) =>
        email.email === adminEmail && email.kind === "workspace-invitation",
    );
  expect(invitation).toBeDefined();

  await signOut(page);
  await signUp(page, {
    email: adminEmail,
    name: "Reports Admin",
    next: new URL(invitation!.url).pathname,
  });
  await page.getByRole("button", { name: "Aceitar convite" }).click();
  await expect(
    page.getByRole("heading", { name: "Nenhum tempo registrado neste dia." }),
  ).toBeVisible();
  await addManualTime(page, projectName, "06:00", "06:30", demandName);

  await page.goto(`${workspacePath}/reports`);
  await openMobileDisclosure(page, "details.reports-filter-disclosure");
  await expect(page.getByLabel("Colaborador")).toBeVisible();
  await expect(page.locator(".reports-table tbody tr")).toHaveCount(2);
  const [adminDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Exportar CSV" }).click(),
  ]);
  const adminCsv = await readFile((await adminDownload.path())!);
  expect(adminCsv.subarray(0, 3).toString("hex")).toBe("efbbbf");
  expect(adminCsv.toString("utf8")).toContain("Reports Owner");
  expect(adminCsv.toString("utf8")).toContain("Reports Admin");
});

test("Reports shows a neutral empty state", async ({ page }, testInfo) => {
  const stamp = `${testInfo.project.name}-${Date.now()}`;
  await signUp(page, {
    email: `reports-empty-${stamp}@example.com`,
    name: "Empty Reports",
  });
  await completeOnboarding(page, `Empty Reports ${stamp}`);
  const workspacePath = new URL(page.url()).pathname;
  await page.goto(`${workspacePath}/reports`);
  await expect(page.getByRole("heading", { name: "Relatórios" })).toBeVisible();
  await expect(page.getByText("Nenhum tempo encontrado.")).toBeVisible();
  await expect(page.locator(".reports-table tbody tr")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Exportar CSV" }),
  ).toBeVisible();
});

test("demand filter isolates one demand on screen and in CSV", async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  const stamp = `${testInfo.project.name}-${Date.now()}`;
  const projectName = `Demand Filter ${stamp}`;
  const workItemName = `Target demand ${stamp}`;
  const otherWorkItemName = `Other demand ${stamp}`;
  await signUp(page, {
    email: `reports-demand-filter-${stamp}@example.com`,
    name: "Demand Filter Owner",
  });
  await completeOnboarding(page, `Demand Filter ${stamp}`);
  const workspacePath = new URL(page.url()).pathname;
  await createProject(page, projectName);
  await createDemand(page, projectName, workItemName);
  await createDemand(page, projectName, otherWorkItemName);

  await addManualTime(page, projectName, "06:00", "07:00", otherWorkItemName);
  await addManualTime(page, projectName, "07:00", "08:00", workItemName);

  await page.goto(`${workspacePath}/reports`);
  await expect(page.locator(".reports-table tbody tr")).toHaveCount(2);
  await openMobileDisclosure(page, "details.reports-filter-disclosure");
  await page.getByLabel("Demanda").selectOption({ label: workItemName });
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(/workItemId=/);
  await expect(page.locator(".reports-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".reports-table tbody tr")).toContainText(
    workItemName,
  );
  await expect(page.locator(".reports-table tbody tr")).not.toContainText(
    otherWorkItemName,
  );

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Exportar CSV" }).click(),
  ]);
  const csv = await readFile((await download.path())!);
  const csvText = csv.toString("utf8");
  expect(csvText).toContain(workItemName);
  expect(csvText).not.toContain(otherWorkItemName);
  expect(csvText.match(/\r\n/g)?.length).toBe(2);
});
