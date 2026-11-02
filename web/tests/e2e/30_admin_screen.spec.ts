import { expect, test, type Page } from "@playwright/test";
import {
  ADMIN,
  addWishlistItem,
  openAccount,
  registerUser,
  signInAsAdmin,
} from "./helpers";

async function reserve(page: Page, itemId: string) {
  const res = await page.request.post(`/api/wishlists/items/${itemId}/reserve`);
  expect(res.ok()).toBeTruthy();
}

test("the admin sees every reservation, their own only on demand", async ({
  page,
  browser,
}) => {
  const suffix = Date.now().toString(36);
  const familyName = `Famille Admin ${suffix}`;
  const relativeName = `Proche ${suffix}`;

  await signInAsAdmin(page);
  const created = await page.request.post("/api/families", {
    data: { name: familyName },
  });
  const { invite_code } = await created.json();
  const adminWish = await addWishlistItem(page, { title: `Écharpe ${suffix}` });

  const relativeContext = await browser.newContext();
  const relative = await relativeContext.newPage();
  await registerUser(relative, relativeName);
  const joined = await relative.request.post("/api/families/join", {
    data: { code: invite_code },
  });
  expect(joined.ok()).toBeTruthy();
  const relativeWish = await addWishlistItem(relative, {
    title: `Livre ${suffix}`,
  });
  await reserve(relative, adminWish.id);
  await reserve(page, relativeWish.id);

  await openAccount(relative);
  await expect(relative.locator('[data-test="account-admin"]')).toHaveCount(0);
  await relative.goto("/admin");
  await expect(relative).toHaveURL(/\/me$/);
  await relativeContext.close();

  await page.goto("/me");
  await expect(page.getByText(`Écharpe ${suffix}`)).toBeVisible();
  await expect(page.getByText(relativeName)).toHaveCount(0);

  await openAccount(page);
  await page.click('[data-test="account-admin"]');
  await expect(page).toHaveURL(/\/admin$/);

  const family = page.locator(
    `[data-test="admin-family"][data-name="${familyName}"]`,
  );
  await family
    .locator(`[data-test="admin-member"][data-name="${relativeName}"]`)
    .click();
  await expect(
    page.locator(`[data-test="admin-item"][data-title="Livre ${suffix}"]`),
  ).toContainText(`Réservé par ${ADMIN.name}`);

  await page.click('[data-test="admin-back"]');
  await family
    .locator(`[data-test="admin-member"][data-name="${ADMIN.name}"]`)
    .click();
  const ownWish = page.locator(
    `[data-test="admin-item"][data-title="Écharpe ${suffix}"]`,
  );
  await expect(ownWish).toBeVisible();
  await expect(page.locator('[data-test="admin-reservation"]')).toHaveCount(0);

  await page.click('[data-test="admin-toggle-reservations"]');
  await expect(ownWish).toContainText(`Réservé par ${relativeName}`);
});
