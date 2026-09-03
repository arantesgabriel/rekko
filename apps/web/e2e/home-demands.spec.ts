import { expect, test } from "@playwright/test";

const password = "Rekko-home-demands-2026";

async function signUp(page: import("@playwright/test").Page, stamp: string) {
  await page.goto("/signup");
  await page.getByLabel("Nome").fill("Home Demands User");
  await page.getByLabel("Email").fill(`home-demands-${stamp}@example.com`);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page
    .getByLabel("Nome do workspace")
    .fill(`Home Demands Workspace ${stamp}`);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("button", { name: "Continuar sem trazer ninguém" })
    .click();
  await page.getByRole("button", { name: "Criar workspace" }).click();
  await expect(page).toHaveURL(/\/w\/[^/]+$/);
}

test("unifies the operational home and manages demands", async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  const stamp = `${testInfo.project.name}-${Date.now()}`;
  const projectName = `Home Project ${stamp}`;
  const demandName = `Provider Analysis ${stamp}`;

  await signUp(page, stamp);
  const workspacePath = new URL(page.url()).pathname;

  await expect(
    page.getByRole("link", { name: "Home", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Hoje", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Timeline", exact: true }),
  ).toHaveCount(0);

  await page.goto(`${workspacePath}/timeline`);
  await expect(page).toHaveURL(new RegExp(`${workspacePath}$`));

  await page.getByRole("button", { name: "Dia anterior" }).click();
  await expect(page).toHaveURL(/date=\d{4}-\d{2}-\d{2}/);
  await page.getByRole("button", { name: "Hoje", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${workspacePath}$`));

  await page.goto(`${workspacePath}/work`);
  await page.getByRole("link", { name: "Criar projeto", exact: true }).click();
  await page.getByRole("link", { name: "Criar manualmente" }).click();
  await page.getByLabel("Nome *").fill(projectName);
  await page.getByRole("button", { name: "Criar projeto" }).click();
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();

  await page.goto(`${workspacePath}/work/new?mode=demand`);
  await page.getByLabel("Projeto *").selectOption({ label: projectName });
  await page.getByLabel("Título *").fill(demandName);
  await page.getByLabel("Descrição").fill("Análise do provider");
  await page.getByRole("button", { name: "Criar demanda" }).click();
  await expect(page).toHaveURL(/\/work\?created=1$/);
  await expect(page.getByText(demandName, { exact: true })).toBeVisible();
  await expect(page.getByText("Ativa", { exact: true })).toBeVisible();
  await expect(
    page.locator(".demand-row").getByRole("link", { name: projectName }),
  ).toBeVisible();

  const search = page.getByLabel("Buscar demandas");
  await search.fill("Provider Analysis");
  await expect(page).toHaveURL(/q=Provider\+Analysis/);
  await expect(page.getByText(demandName, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros" }).click();

  await page.goto(workspacePath);
  await page.getByRole("button", { name: "Adicionar tempo" }).first().click();
  await page.getByLabel("Início").fill("08:00");
  await page.getByLabel("Fim").fill("09:00");
  await page
    .locator('select[name="projectId"]')
    .selectOption({ label: projectName });
  await page
    .locator('select[name="workItemId"]')
    .selectOption({ label: demandName });
  await page.getByRole("button", { name: "Salvar tempo" }).click();
  await expect(
    page.locator(".home-timeline-block").filter({ hasText: demandName }),
  ).toBeVisible();

  await page.goto(`${workspacePath}/work`);
  await expect(
    page
      .locator(".demand-row")
      .filter({ hasText: demandName })
      .locator(".demand-row__time"),
  ).toContainText("1h");
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      ),
    )
    .toBeLessThanOrEqual(0);

  const accountMenu = page.locator("details.app-account-menu:visible");
  await accountMenu.locator("summary").click();
  await accountMenu.getByRole("button", { name: "Usar tema escuro" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      ),
    )
    .toBeLessThanOrEqual(0);
});
