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

  await page.goto(`${workspacePath}/projects`);
  const projectCard = page.locator(".project-card").filter({
    has: page.getByRole("heading", { name: projectName }),
  });
  await expect(projectCard).toBeVisible();
  await expect(projectCard).not.toContainText("Sem estimativa");
  await expect(projectCard.locator(".project-card__stat")).toHaveCount(2);
  await expect(projectCard.locator("dt")).toHaveText([
    "Tempo registrado",
    "Demandas",
  ]);
  await expect
    .poll(() =>
      projectCard
        .locator(".project-card__stat")
        .first()
        .evaluate((element) => getComputedStyle(element).animationName),
    )
    .toBe("project-card-content-in");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() =>
      projectCard
        .locator(".project-card__stat")
        .first()
        .evaluate((element) => getComputedStyle(element).animationName),
    )
    .toBe("none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  expect(
    (await projectCard.boundingBox())?.width ?? Infinity,
  ).toBeLessThanOrEqual(448);
  await projectCard.click();
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
  await expect(
    page.getByText("Contexto para organizar demandas e reconstruir seu tempo."),
  ).toHaveCount(0);
  await expect(page.getByText("Sem estimativa")).toHaveCount(0);

  await page.goto(`${workspacePath}/work`);
  const createDemand = page.getByRole("button", {
    name: "Nova demanda",
    exact: true,
  });
  const expectedControlHeight =
    (page.viewportSize()?.width ?? 1280) < 768 ? "44px" : "36px";
  await expect
    .poll(() =>
      createDemand.evaluate((button) => getComputedStyle(button).height),
    )
    .toBe(expectedControlHeight);
  if ((page.viewportSize()?.width ?? 1280) >= 768) {
    const projectsLink = page
      .locator(".page-header")
      .getByRole("link", { name: "Projetos", exact: true });
    const rightBefore = await createDemand.evaluate(
      (button) => button.getBoundingClientRect().right,
    );
    await createDemand.hover();
    await expect
      .poll(() =>
        createDemand.evaluate((button) => button.getBoundingClientRect().width),
      )
      .toBeGreaterThan(100);
    const rightAfter = await createDemand.evaluate(
      (button) => button.getBoundingClientRect().right,
    );
    const gapAfter = await projectsLink.evaluate(
      (link) =>
        link.nextElementSibling!.getBoundingClientRect().left -
        link.getBoundingClientRect().right,
    );
    const labelFontSize = await createDemand
      .locator(".demands-create-button__label")
      .evaluate((label) => getComputedStyle(label).fontSize);
    expect(Math.abs(rightAfter - rightBefore)).toBeLessThanOrEqual(1);
    expect(gapAfter).toBe(8);
    expect(labelFontSize).toBe("12px");
  }
  await createDemand.click();
  await page.getByLabel("Projeto *").selectOption({ label: projectName });
  await page.getByLabel("Título *").fill(demandName);
  await page.getByLabel("Descrição").fill("Análise do provider");
  await page
    .locator(".drawer-form__footer")
    .getByRole("button", { name: "Criar demanda", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`${workspacePath}/work$`));
  await expect(page.getByText(demandName, { exact: true })).toBeVisible();
  await expect(page.getByText("Ativa", { exact: true })).toBeVisible();
  await expect(
    page.locator(".demand-row").getByRole("link", { name: projectName }),
  ).toBeVisible();
  await page.getByRole("button", { name: demandName, exact: true }).click();
  await expect(
    page.getByRole("heading", { name: demandName, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fechar painel" }).click();

  const search = page.getByLabel("Buscar demandas");
  await search.fill("Provider Analysis");
  await expect(page).toHaveURL(/q=Provider\+Analysis/);
  await expect(page.getByText(demandName, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros" }).click();

  await page.goto(workspacePath);
  await page.getByRole("button", { name: "Adicionar tempo" }).first().click();
  const drawerOverflow = await page
    .locator(".time-drawer")
    .evaluate((drawer) => drawer.scrollWidth - drawer.clientWidth);
  expect(drawerOverflow).toBeLessThanOrEqual(0);
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
