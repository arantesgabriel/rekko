import { expect, test } from "@playwright/test";

const password = "Rekko-insights-2026";

test("shows personal tracked time and estimated versus actual", async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  const stamp = `${testInfo.project.name}-${Date.now()}`;
  await page.goto("/signup");
  await page.getByLabel("Nome").fill("Insights User");
  await page.getByLabel("Email").fill(`insights-${stamp}@example.com`);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.getByLabel("Nome do workspace").fill(`Insights ${stamp}`);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("button", { name: "Continuar sem trazer ninguém" })
    .click();
  await page.getByRole("button", { name: "Criar workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Nenhum tempo registrado neste dia." }),
  ).toBeVisible();
  const workspacePath = new URL(page.url()).pathname;

  await page.goto(`${workspacePath}/work`);
  await page.getByRole("link", { name: "Criar projeto" }).first().click();
  await page.getByRole("link", { name: "Criar manualmente" }).click();
  await page.getByLabel("Nome *").fill("Insights Project");
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await page.locator("summary").filter({ hasText: "Criar demanda" }).click();
  const createItem = page.locator("details.create-item");
  await createItem.getByLabel("Título *").fill("Estimated item");
  await createItem.getByLabel("Estimativa", { exact: true }).fill("1h");
  await createItem
    .getByRole("button", { name: "Criar demanda", exact: true })
    .click();
  await expect(page.getByText("Demanda criada.")).toBeVisible();

  await page.goto(workspacePath);
  await page.getByRole("button", { name: "Adicionar tempo" }).first().click();
  await page.getByLabel("Início").fill("08:00");
  await page.getByLabel("Fim").fill("09:30");
  await page
    .locator('select[name="projectId"]')
    .selectOption({ label: "Insights Project" });
  await page
    .locator('select[name="workItemId"]')
    .selectOption({ label: "Estimated item" });
  await page.getByRole("button", { name: "Salvar tempo" }).click();
  await expect(
    page.locator(".timeline-block").filter({ hasText: "Estimated item" }),
  ).toBeVisible();

  const insightsPath = `${workspacePath}/insights`;
  await page.goto(insightsPath, { waitUntil: "commit" });
  await expect(page).toHaveURL(new RegExp(`${workspacePath}/insights$`));
  await expect(page.getByRole("heading", { name: "Insights" })).toBeVisible();
  const summary = page.getByRole("region", { name: "Resumo do período" });
  await expect(summary.getByText("Registrado", { exact: true })).toBeVisible();
  await expect(summary.getByText("1h 30m", { exact: true })).toBeVisible();
  await expect(summary.getByText("Estimado", { exact: true })).toBeVisible();
  await expect(summary.getByText("Diferença", { exact: true })).toBeVisible();
  await expect(summary.getByText("+30m", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Horas por projeto" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("list", { name: "Horas registradas por projeto" })
      .getByText("Insights Project", { exact: true }),
  ).toBeVisible();

  await page
    .locator('select[name="projectId"]')
    .selectOption({ label: "Insights Project" });
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page).toHaveURL(/projectId=/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("shows the empty state without empty charts", async ({
  page,
}, testInfo) => {
  const stamp = `${testInfo.project.name}-${Date.now()}`;
  await page.goto("/signup");
  await page.getByLabel("Nome").fill("Empty Insights User");
  await page.getByLabel("Email").fill(`empty-insights-${stamp}@example.com`);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.getByLabel("Nome do workspace").fill(`Empty Insights ${stamp}`);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("button", { name: "Continuar sem trazer ninguém" })
    .click();
  await page.getByRole("button", { name: "Criar workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Nenhum tempo registrado neste dia." }),
  ).toBeVisible();
  const workspacePath = new URL(page.url()).pathname;
  await page.goto(`${workspacePath}/insights`);
  await expect(
    page.getByText("Nenhum tempo registrado neste período."),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Horas por projeto" }),
  ).toHaveCount(0);
});
