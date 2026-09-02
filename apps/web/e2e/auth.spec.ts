import { expect, test } from "@playwright/test";

test("login validates locally without aggressive typing errors", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("a");
  await expect(page.getByText("Informe um email válido.")).toHaveCount(0);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByText("Informe um email válido.")).toBeVisible();
  await expect(page.getByText("Informe sua senha.")).toBeVisible();
});

test("login password toggle is accessible and does not shift layout", async ({
  page,
}) => {
  await page.goto("/login");
  const password = page.getByLabel("Senha", { exact: true });
  const toggle = page.getByRole("button", { name: "Mostrar senha" });
  const before = await password.boundingBox();
  await password.fill("secret-pass");
  await expect(password).toHaveAttribute("type", "password");
  await toggle.click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(
    page.getByRole("button", { name: "Ocultar senha" }),
  ).toBeVisible();
  const after = await password.boundingBox();
  expect(before?.width).toBe(after?.width);
});

test("signup includes terms links and the same password rule", async ({
  page,
}) => {
  await page.goto("/signup");
  await expect(
    page.getByRole("link", { name: "Termos de Uso" }),
  ).toHaveAttribute("href", "/terms");
  await expect(
    page.getByRole("link", { name: "Política de Privacidade" }),
  ).toHaveAttribute("href", "/privacy");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByText("Informe seu nome.")).toBeVisible();
  await expect(page.getByText("Informe seu email.")).toBeVisible();
  await expect(page.getByText("Informe sua senha.")).toBeVisible();
});

test("auth footer stays in document flow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/signup");
  await expect(page.getByText("Grátis durante o beta")).toBeVisible();
  const footer = page.locator(".auth-footer");
  await expect(footer).toHaveCSS("position", "relative");
});

test("email verification screen keeps the next step clear", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/verify-email?email=visual-test%40example.com");

  await expect(
    page.getByRole("heading", { name: "Confirme seu e-mail" }),
  ).toBeVisible();
  await expect(
    page.getByText("visual-test@example.com", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reenviar e-mail de confirmação" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Não encontrou o e-mail? Verifique também sua caixa de spam.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Usar outra conta" }),
  ).toBeVisible();
  await expect(page.getByText(/core do Rekko/i)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Confirmar ou reenviar/i }),
  ).toHaveCount(0);

  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(
    "/verify-email?email=nome.muito.longo%40subdominio.exemplo.com.br",
  );
  const horizontalOverflow = await page.evaluate(() =>
    Math.max(
      document.documentElement.scrollWidth - window.innerWidth,
      document.body.scrollWidth - window.innerWidth,
    ),
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(1);
});

test("email verification link keeps a functional confirmation action", async ({
  page,
}) => {
  await page.goto("/verify-email?token=demo-token");
  await expect(
    page.getByRole("button", { name: "Confirmar e continuar" }),
  ).toBeVisible();
});

const laptopViewports = [
  { width: 1512, height: 982 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 800 },
] as const;

for (const viewport of laptopViewports) {
  test(`signup fits ${viewport.width}x${viewport.height} without vertical scroll`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/signup");
    await expect(
      page.getByRole("link", { name: "Rekko — página inicial" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Criar conta" }),
    ).toBeInViewport();
    await expect(
      page.getByRole("link", { name: "Termos de Uso" }),
    ).toBeInViewport();
    await expect(page.getByRole("link", { name: "Entrar" })).toBeInViewport();
    const overflow = await page.evaluate(() => {
      const root = document.querySelector(".auth-experience");
      const main = document.querySelector(".auth-experience__main");
      if (!root || !main) return Number.POSITIVE_INFINITY;
      return Math.max(
        root.scrollHeight - root.clientHeight,
        main.scrollHeight - main.clientHeight,
        document.documentElement.scrollHeight - window.innerHeight,
      );
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test(`login fits ${viewport.width}x${viewport.height} without vertical scroll`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/login");
    await expect(
      page.getByRole("button", { name: "Entrar", exact: true }),
    ).toBeInViewport();
    await expect(
      page.getByRole("link", { name: "Começar grátis" }),
    ).toBeInViewport();
    const overflow = await page.evaluate(() => {
      const root = document.querySelector(".auth-experience");
      const main = document.querySelector(".auth-experience__main");
      if (!root || !main) return Number.POSITIVE_INFINITY;
      return Math.max(
        root.scrollHeight - root.clientHeight,
        main.scrollHeight - main.clientHeight,
        document.documentElement.scrollHeight - window.innerHeight,
      );
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
