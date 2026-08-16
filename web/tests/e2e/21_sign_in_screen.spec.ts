import { test, expect } from "@playwright/test";
import { registerUser, uniqueEmail, usePasswordForm } from "./helpers";

test("the landing page is the auth screen, pitch and card in one", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /Qu’est-ce qui vous ferait plaisir/ }),
  ).toBeVisible();
  await expect(page.locator('[data-test="magic-email"]')).toBeVisible();
  await expect(page.locator('[data-test="sample-wishlist"]')).toBeVisible();
});

test("the three value props are on the screen", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Une ligne suffit")).toBeVisible();
  await expect(page.getByText("La famille est optionnelle")).toBeVisible();
  await expect(page.getByText("Jamais deux fois le même cadeau")).toBeVisible();
});

test("signing up and signing in are the same act on the primary path", async ({
  page,
}) => {
  await page.goto("/");

  // One field, one button — nothing asks which of the two the visitor wants.
  await expect(page.locator('[data-test="magic-email"]')).toBeVisible();
  await expect(page.locator('input[name="name"]')).toHaveCount(0);
  await expect(page.locator('input[name="password"]')).toHaveCount(0);

  const requested = page.waitForResponse(
    (res) =>
      res.url().includes("/api/auth/magic-link") && res.status() === 200,
  );
  await page.fill('[data-test="magic-email"]', uniqueEmail());
  await page.click('[data-test="magic-send"]');
  await requested;

  await expect(page.locator('[data-test="magic-sent"]')).toBeVisible();
});

test("the password fallback carries both branches, one click away", async ({
  page,
}) => {
  await page.goto("/");
  await usePasswordForm(page);

  await expect(page.locator('input[name="password"]')).toBeVisible();
  await expect(page.locator('input[name="name"]')).toHaveCount(0);

  await page.click('button[data-test="want-register"]');
  await expect(page.locator('input[name="name"]')).toBeVisible();
  await expect(page.locator('input[name="new-password"]')).toBeVisible();
});

test("the sample list opens with no account and stays read-only", async ({
  page,
}) => {
  await page.goto("/");
  await page.click('[data-test="nav-sample"]');

  await expect(page).toHaveURL(/\/sample/);
  await expect(page.locator('[data-test="sample-wishlist"]')).toBeVisible();
  await expect(
    page.getByText("Appareil photo instantané Instax"),
  ).toBeVisible();
  await expect(page.getByText("Liste fictive")).toBeVisible();
});

test("the guards still send an authenticated visitor to their own list", async ({
  page,
}) => {
  await registerUser(page);

  await page.goto("/");
  await expect(page).toHaveURL(/\/me/);

  // The two merged paths survive as redirects rather than 404s.
  await page.goto("/auth/login");
  await expect(page).toHaveURL(/\/me/);
});
