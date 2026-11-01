import { test, expect } from "@playwright/test";
import { registerUser, uniqueEmail, usePasswordForm } from "./helpers";

test("the landing page says hello and asks for one thing", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Bonjour" })).toBeVisible();
  await expect(page.getByText("Pour entrer, indique ton adresse e-mail.")).toBeVisible();
  await expect(page.locator('[data-test="magic-email"]')).toBeVisible();
  await expect(page.locator('[data-test="magic-send"]')).toHaveText(
    "Recevoir le lien",
  );
  await expect(page.locator('[data-test="nav-sample"]')).toHaveCount(0);
});

test("signing up and signing in are the same act on the primary path", async ({
  page,
}) => {
  await page.goto("/");

  // One field, one button — nothing asks which of the two the visitor wants.
  await expect(page.locator('input[name="name"]')).toHaveCount(0);
  await expect(page.locator('input[name="password"]')).toHaveCount(0);

  const requested = page.waitForResponse(
    (res) =>
      res.url().includes("/api/auth/magic-link") && res.status() === 200,
  );
  const email = uniqueEmail();
  await page.fill('[data-test="magic-email"]', email);
  await page.click('[data-test="magic-send"]');
  await requested;

  const sent = page.locator('[data-test="magic-sent"]');
  await expect(sent).toContainText("C’est envoyé");
  await expect(sent).toContainText("Jette un œil dans les spams.");

  await sent.locator('[data-test="magic-change"]').click();
  await expect(page.locator('[data-test="magic-email"]')).toBeVisible();
});

test("the password fallback carries both branches, one click away", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator('[data-test="use-password"]')).toHaveText(
    "Me connecter avec un mot de passe",
  );
  await usePasswordForm(page);

  await expect(page.locator('input[name="password"]')).toBeVisible();
  await expect(page.locator('input[name="name"]')).toHaveCount(0);

  await page.click('button[data-test="want-register"]');
  await expect(page.locator('input[name="name"]')).toBeVisible();
  await expect(page.locator('input[name="new-password"]')).toBeVisible();

  await page.click('[data-test="use-magic-link"]');
  await expect(page.locator('[data-test="magic-email"]')).toBeVisible();
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
