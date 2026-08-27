import { expect, test } from "@playwright/test";

test("landing communicates the product and navigates", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Reconstrua seu tempo. Entenda sua jornada.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Grátis durante o beta").first()).toBeVisible();
  await page.getByRole("link", { name: "Ver como funciona" }).click();
  await expect(
    page.getByRole("heading", { name: "Registrar. Reconstruir. Entender." }),
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
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByText("Conta criada. Enviamos um link")).toBeVisible();
  await expect(page).toHaveURL(/\/onboarding\/workspace/);
  await expect(page.getByText(/Confirme seu email nos próximos/)).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("heading", { name: "Onde seu tempo acontece?" }),
  ).toBeVisible();
  await page.getByLabel("Abrir opções da conta").click();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Onde seu tempo acontece?" }),
  ).toBeVisible();
  await page.getByLabel("Abrir opções da conta").click();
  await page
    .getByRole("button", { name: "Sair de todos os dispositivos" })
    .click();
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
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

test("runs, pauses and resumes the landing timer without resetting", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".preview-timer")).toHaveText("00:00:00");
  await page.getByRole("button", { name: "Iniciar timer" }).click();
  await expect(page.locator(".preview-timer")).not.toHaveText("00:00:00", {
    timeout: 2500,
  });
  await page.getByRole("button", { name: "Pausar" }).click();
  const pausedAt = await page.locator(".preview-timer").innerText();
  await page.waitForTimeout(1100);
  await expect(page.locator(".preview-timer")).toHaveText(pausedAt);
  await page.getByRole("button", { name: "Retomar" }).click();
  await expect(page.locator(".preview-timer")).not.toHaveText(pausedAt, {
    timeout: 2500,
  });
});

test("provides the complete mobile navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await expect(
    page.getByRole("dialog", { name: "Menu principal" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Entrar" }).last()).toBeVisible();
  await expect(
    page
      .getByRole("dialog", { name: "Menu principal" })
      .getByRole("button", { name: /Usar tema/ }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Menu principal" }),
  ).toBeHidden();
  await expect(page.getByRole("button", { name: "Abrir menu" })).toBeFocused();
});
