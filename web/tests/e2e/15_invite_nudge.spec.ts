import { test, expect } from "@playwright/test";
import { createFamily, registerUser } from "./helpers";

test.describe("Invite nudge", () => {
  test("a family-less user can dismiss it for good", async ({ browser }) => {
    const page = await (await browser.newContext()).newPage();
    await registerUser(page, "Sans Famille");

    const nudge = page.locator('[data-test="invite-nudge"]');
    await expect(nudge).toBeVisible();

    await page.click('[data-test="invite-nudge-dismiss"]');
    await expect(nudge).toHaveCount(0);

    await page.reload();
    await expect(page.locator('[data-test="share-card"]')).toBeVisible();
    await expect(nudge).toHaveCount(0);
  });

  test("it never shows to a user who is in a family", async ({ browser }) => {
    const page = await (await browser.newContext()).newPage();
    await registerUser(page, "Avec Famille");
    await createFamily(page, "Famille Test");

    await page.goto("/me");
    await expect(page.locator('[data-test="share-card"]')).toBeVisible();
    await expect(page.locator('[data-test="invite-nudge"]')).toHaveCount(0);
  });
});
