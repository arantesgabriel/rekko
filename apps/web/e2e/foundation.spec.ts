import { expect, test } from "@playwright/test";

test("landing communicates the product and navigates", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Reconstrua seu tempo. Entenda sua jornada.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Free during beta").first()).toBeVisible();
  await page.getByRole("link", { name: "Ver como funciona" }).click();
  await expect(
    page.getByRole("heading", { name: "Track. Reconstruct. Understand." }),
  ).toBeInViewport();
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Que bom ter você de volta." }),
  ).toBeVisible();
});

test("protects the app without a session", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login/);
});

test("signs up, shows grace state, signs out and signs back in", async ({
  page,
}, testInfo) => {
  const email = `e2e-${testInfo.project.name}-${Date.now()}@example.com`;
  const password = "Rekko-test-2026";
  await page.goto("/signup");
  await page.getByLabel("Nome").fill("Pessoa E2E");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByText("Conta criada. Enviamos um link")).toBeVisible();
  await expect(page).toHaveURL(/\/app/);
  await expect(page.getByText(/Confirme seu email nos próximos/)).toBeVisible();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Olá, Pessoa E2E." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Sair de todos os dispositivos" })
    .click();
  await expect(page).toHaveURL(/\/login/);
});

test("forgot password does not reveal account existence", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill("unknown@example.com");
  await page
    .getByRole("button", { name: "Enviar link de recuperação" })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Se houver uma conta com este email",
  );
});

test("switches and persists the selected theme", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Usar tema escuro" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("keeps auth keyboard reachable", async ({ page }) => {
  await page.goto("/login");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Rekko — página inicial" }),
  ).toBeFocused();
});

test("keeps the landing useful with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Reconstrua seu tempo. Entenda sua jornada.",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Iniciar timer" }).click();
  await expect(page.getByRole("button", { name: "Pausar" })).toBeVisible();
  await page.getByRole("button", { name: "Reconstruir" }).click();
  await expect(page.getByText("Reunião", { exact: true })).toBeVisible();
});
