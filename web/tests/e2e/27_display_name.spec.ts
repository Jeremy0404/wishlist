import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { addWishlistItem, registerUser } from "./helpers";

async function shareOwnList(page: Page): Promise<string> {
  const published = page.waitForResponse(
    (res) => res.url().includes("/api/wishlists/me/publish") && res.ok(),
  );
  await page.click('[data-test="share-visibility-shared"]');
  await published;

  const { wishlist } = await (
    await page.request.get("/api/wishlists/me")
  ).json();
  return wishlist.public_slug;
}

test("the name chosen on the welcome screen is the one the share page shows", async ({
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

  await expect(page.locator('[data-test="display-name-value"]')).toHaveText(
    "Marie Dupont",
  );

  await addWishlistItem(page, { title: "Plaid tout doux" });
  const slug = await shareOwnList(page);

  const visitor = await (
    await page.context().browser()!.newContext()
  ).newPage();
  await visitor.goto(`/share/${slug}`);

  await expect(visitor.locator("h1")).toContainText("Marie Dupont");
  await expect(visitor.getByLabel("Marie Dupont")).toBeVisible();
});

test("the welcome screen is a nudge, not a gate", async ({ page }) => {
  await registerUser(page, "Derived Name");

  await page.goto("/welcome");
  await page.click('[data-test="welcome-name-skip"]');

  await expect(page).toHaveURL(/\/me/);
  await expect(page.locator('[data-test="display-name-value"]')).toHaveText(
    "Derived Name",
  );
});

test("signing in never sends an existing account to the welcome screen", async ({
  page,
}) => {
  const { email, password } = await registerUser(page, "Alexa Chen");
  await page.click('button[data-test="logout"]');

  await page.goto("/");
  await page.click('button[data-test="use-password"]');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/me/);
  await expect(page.locator('[data-test="welcome-name"]')).toHaveCount(0);
});

test("the name can be changed later, straight from the list", async ({
  page,
}) => {
  await registerUser(page, "Alexa Chen");

  await page.click('[data-test="display-name-edit"]');
  const field = page.locator('[data-test="display-name-input"]');
  await expect(field).toHaveValue("Alexa Chen");

  await field.fill("Alexa Martin");
  await page.click('[data-test="display-name-save"]');

  await expect(page.locator('[data-test="display-name-value"]')).toHaveText(
    "Alexa Martin",
  );

  await page.reload();
  await expect(page.locator('[data-test="display-name-value"]')).toHaveText(
    "Alexa Martin",
  );
});

test("a blank name is refused and changes nothing", async ({ page }) => {
  await registerUser(page, "Alexa Chen");

  await page.click('[data-test="display-name-edit"]');
  await page.locator('[data-test="display-name-input"]').fill("   ");
  await page.click('[data-test="display-name-save"]');

  await expect(page.locator('[data-test="display-name-editor"]')).toBeVisible();

  await page.reload();
  await expect(page.locator('[data-test="display-name-value"]')).toHaveText(
    "Alexa Chen",
  );
});
