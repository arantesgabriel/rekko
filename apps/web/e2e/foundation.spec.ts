import { expect, test } from "@playwright/test";

test("renders the foundation routes", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Reconstrua seu tempo. Entenda sua jornada.",
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Entrar" }).click();
  await expect(
    page.getByRole("heading", { name: "Boas-vindas ao Rekko" }),
  ).toBeVisible();

  await page.goto("/app");
  await expect(
    page.getByRole("heading", { name: "A base do seu dia está pronta." }),
  ).toBeVisible();
});

test("switches and persists the selected theme", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Escuro" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("button", { name: "Escuro" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("keeps primary navigation keyboard reachable", async ({ page }) => {
  await page.goto("/app");

  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Rekko — página inicial" }),
  ).toBeFocused();

  const tabsUntilNavigation =
    (page.viewportSize()?.width ?? 1024) < 768 ? 4 : 1;

  for (let index = 0; index < tabsUntilNavigation; index += 1) {
    await page.keyboard.press("Tab");
  }

  await expect(
    page
      .getByRole("navigation", { name: "Navegação principal" })
      .filter({ visible: true })
      .getByRole("link", { name: "Today" }),
  ).toBeFocused();
});
