import { expect, test } from "@playwright/test";

const password = "Rekko-settings-2026";

test("Owner reaches Settings from the account menu and keeps it responsive", async ({
  page,
}, testInfo) => {
  const stamp = `${testInfo.project.name}-${Date.now()}`;
  await page.goto("/signup");
  await page.getByLabel("Nome").fill("Settings Owner");
  await page.getByLabel("Email").fill(`settings-owner-${stamp}@example.com`);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Criar conta" }).click();

  await page.getByLabel("Nome do workspace").fill(`Settings ${stamp}`);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("button", { name: "Continuar sem trazer ninguém" })
    .click();
  await page.getByRole("button", { name: "Criar workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Nenhum tempo registrado neste dia." }),
  ).toBeVisible();

  const workspacePath = new URL(page.url()).pathname;
  const menu = page.locator("details.app-account-menu:visible");
  await menu.locator("summary").click();
  await menu.getByRole("link", { name: "Configurações" }).click();
  await expect(page).toHaveURL(`${workspacePath}/settings`);
  await expect(
    page.getByRole("heading", { name: "Configurações" }),
  ).toBeVisible();
  await expect(page.getByLabel("Nome", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeDisabled();
  const userTimezone = page.getByRole("combobox", {
    name: "Sua timezone",
    exact: true,
  });
  await expect(userTimezone).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: /Timezone do Workspace/ }),
  ).toBeVisible();
  await expect(page.getByText("Gerenciar integrações")).toBeVisible();

  await page
    .locator(".settings-inline-control")
    .getByRole("button", { name: "Usar tema escuro" })
    .click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Configurações" }),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  const mobileTimezone = page.getByRole("combobox", {
    name: "Sua timezone",
    exact: true,
  });
  await mobileTimezone.focus();
  await expect(mobileTimezone).toBeFocused();
});
