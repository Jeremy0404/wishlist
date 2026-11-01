import { test, expect } from "@playwright/test";
import { registerUser, createFamily, addWishlistItem } from "./helpers";

// Tapping a wish opens it in the sheet; the saved fields show on the row and
// persist through the API.
test("edit an existing wishlist item", async ({ page }) => {
  await registerUser(page);
  await createFamily(page, "Inline Edit Family");

  const created = await addWishlistItem(page, {
    title: "Retro Camera",
    url: "https://example.com/camera",
    price: 150,
    priority: 3,
    notes: "Film preferred",
  });

  const item = page.locator(
    `[data-test="wishlist-item"][data-id="${created.id}"]`,
  );
  await expect(item).toBeVisible();
  await expect(item.locator('[data-test="wishlist-favorite"]')).toHaveCount(0);

  await item.locator('[data-test="wishlist-edit"]').click();
  const sheet = page.locator('[data-test="sheet"]');
  await expect(sheet).toContainText("Modifier ton envie");

  await sheet.locator('input[name="title"]').fill("Retro Camera Pro");
  await sheet
    .locator('input[name="url"]')
    .fill("https://example.com/camera-pro");
  await sheet.locator('input[name="price_eur"]').fill("249");
  await sheet.locator('[data-test="item-favorite"]').click();
  await expect(sheet.locator('[data-test="item-favorite"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await sheet.locator('textarea[name="notes"]').fill("Now with better lens");

  const saveResponse = page.waitForResponse(
    (res) =>
      res.url().includes("/api/wishlists/me/items/") &&
      res.request().method() === "PATCH" &&
      res.status() === 200,
  );
  await sheet.locator('[data-test="wishlist-edit-save"]').click();
  const saved = await (await saveResponse).json();
  expect(saved.priority).toBe(1);
  expect(saved.url).toBe("https://example.com/camera-pro");

  await expect(sheet).toHaveCount(0);
  await expect(item).toContainText("Retro Camera Pro");
  await expect(item).toContainText("249");
  await expect(item).toContainText("Now with better lens");
  await expect(item.locator('[data-test="wishlist-favorite"]')).toBeVisible();
});

test("an older priority shows as a plain wish, a 1 as a coup de cœur", async ({
  page,
}) => {
  await registerUser(page);
  await addWishlistItem(page, { title: "Plaid", priority: 2 });
  await addWishlistItem(page, { title: "Bougie", priority: 1 });

  const plaid = page.locator('[data-test="wishlist-item"][data-title="Plaid"]');
  const bougie = page.locator(
    '[data-test="wishlist-item"][data-title="Bougie"]',
  );
  await expect(plaid.locator('[data-test="wishlist-favorite"]')).toHaveCount(0);
  await expect(bougie.locator('[data-test="wishlist-favorite"]')).toBeVisible();
});
