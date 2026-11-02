import { expect, test, type Page } from "@playwright/test";
import {
  addWishlistItem,
  createFamily,
  joinFamily,
  registerUser,
  signInAsAdmin,
} from "./helpers";

const WISHES_REQUIRED = 2;

async function resetThreshold(page: Page) {
  const res = await page.request.put("/api/admin/settings", {
    data: { minItemsToView: 0 },
  });
  expect(res.ok()).toBeTruthy();
}

test.afterAll(async ({ browser }) => {
  const admin = await (await browser.newContext()).newPage();
  await signInAsAdmin(admin);
  await resetThreshold(admin);
});

test("family lists open once the viewer's own list holds the admin's minimum", async ({
  page,
  browser,
}) => {
  const suffix = Date.now().toString(36);
  const ownerName = `Lina ${suffix}`;

  await signInAsAdmin(page);
  await page.goto("/admin");
  await page.fill(
    '[data-test="admin-settings"] input[name="min-items-to-view"]',
    String(WISHES_REQUIRED),
  );
  const saved = page.waitForResponse(
    (res) =>
      res.url().endsWith("/admin/settings") &&
      res.request().method() === "PUT" &&
      res.ok(),
  );
  await page.click('[data-test="admin-settings-save"]');
  await saved;

  const owner = await (await browser.newContext()).newPage();
  await registerUser(owner, ownerName);
  const { inviteCode } = await createFamily(owner, `Famille Cadenas ${suffix}`);
  const ownerId = (await (await owner.request.get("/api/auth/me")).json()).id;
  const ownerWish = await addWishlistItem(owner, { title: `Livre ${suffix}` });

  const viewer = await (await browser.newContext()).newPage();
  await registerUser(viewer, `Noé ${suffix}`);
  await joinFamily(viewer, inviteCode);
  await addWishlistItem(viewer, { title: `Écharpe ${suffix}` });

  await viewer.goto("/wishlists");
  await expect(viewer.locator('[data-test="browse-locked"]')).toContainText(
    "Ajoute encore 1 envie à ta liste",
  );
  await expect(viewer.locator('[data-test="browse-locked-progress"]')).toHaveText(
    "1 sur 2",
  );
  await expect(viewer.locator('[data-test="wishlist-open"]')).toHaveCount(0);
  await expect(viewer.locator('[data-test="browse-lock"]')).toHaveCount(1);
  await viewer.click('[data-test="browse-locked-add"]');
  await expect(viewer).toHaveURL(/\/me$/);
  await viewer.goto("/wishlists");

  await viewer.locator('[data-test="wishlist-locked"]').click();
  await expect(viewer.locator('[data-test="toast"]')).toContainText(
    "Ajoute encore 1 envie à ta liste",
  );

  expect((await viewer.request.get(`/api/wishlists/${ownerId}`)).status()).toBe(403);
  expect(
    (await viewer.request.post(`/api/wishlists/items/${ownerWish.id}/reserve`)).status(),
  ).toBe(403);

  await viewer.goto(`/wishlists/${ownerId}`);
  await expect(viewer.locator('[data-test="page-message"]')).toContainText(
    "Cette liste est encore fermée",
  );

  await viewer.click('[data-test="page-message-action"]');
  await expect(viewer).toHaveURL(/\/me$/);
  await addWishlistItem(viewer, { title: `Gants ${suffix}` });

  await viewer.goto("/wishlists");
  await expect(viewer.locator('[data-test="browse-locked"]')).toHaveCount(0);
  await viewer.locator('[data-test="wishlist-open"]').click();
  await expect(viewer.getByText(`Livre ${suffix}`)).toBeVisible();
});
