import { expect, test } from "@playwright/test";
import { logout, openAccount, registerUser } from "./helpers";

test("the name chosen on the welcome screen is the one the account shows", async ({
  page,
}) => {
  await registerUser(page, "Derived Name");

  await page.goto("/welcome");
  await expect(page.locator('[data-test="welcome-name"]')).toBeVisible();

  const field = page.locator('[data-test="welcome-name-input"]');
  await expect(field).toHaveValue("Derived Name");

  await field.fill("Marie Dupont");
  await page.click('[data-test="welcome-name-submit"]');
  await expect(page).toHaveURL(/\/me/);

  await openAccount(page);
  await expect(page.locator('[data-test="display-name-value"]')).toHaveText(
    "Marie Dupont",
  );
});

test("the welcome screen is a nudge, not a gate", async ({ page }) => {
  await registerUser(page, "Derived Name");

  await page.goto("/welcome");
  await page.click('[data-test="welcome-name-skip"]');

  await expect(page).toHaveURL(/\/me/);
  await openAccount(page);
  await expect(page.locator('[data-test="display-name-value"]')).toHaveText(
    "Derived Name",
  );
});

test("signing in never sends an existing account to the welcome screen", async ({
  page,
}) => {
  const { email, password } = await registerUser(page, "Alexa Chen");
  await logout(page);

  await page.goto("/");
  await page.click('button[data-test="use-password"]');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/me/);
  await expect(page.locator('[data-test="welcome-name"]')).toHaveCount(0);
});

test("the name can be changed later, from the account menu", async ({
  page,
}) => {
  await registerUser(page, "Alexa Chen");

  await openAccount(page);
  await page.click('[data-test="display-name-edit"]');
  const field = page.locator('[data-test="display-name-input"]');
  await expect(field).toHaveValue("Alexa Chen");

  await field.fill("Alexa Martin");
  await page.click('[data-test="display-name-save"]');

  await expect(page.locator('[data-test="display-name-value"]')).toHaveText(
    "Alexa Martin",
  );

  await page.reload();
  await openAccount(page);
  await expect(page.locator('[data-test="display-name-value"]')).toHaveText(
    "Alexa Martin",
  );
});

test("a blank name is refused and changes nothing", async ({ page }) => {
  await registerUser(page, "Alexa Chen");

  await openAccount(page);
  await page.click('[data-test="display-name-edit"]');
  await page.locator('[data-test="display-name-input"]').fill("   ");
  await page.click('[data-test="display-name-save"]');

  await expect(page.locator('[data-test="display-name-editor"]')).toBeVisible();

  await page.reload();
  await openAccount(page);
  await expect(page.locator('[data-test="display-name-value"]')).toHaveText(
    "Alexa Chen",
  );
});
