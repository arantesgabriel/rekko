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
