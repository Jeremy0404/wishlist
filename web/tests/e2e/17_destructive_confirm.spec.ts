import { test, expect } from "@playwright/test";
import { addWishlistItem, registerUser } from "./helpers";

test("deleting an item asks first, and cancelling keeps it", async ({
  page,
}) => {
  await registerUser(page);
  await addWishlistItem(page, { title: "Théière en fonte" });

  const item = page
    .locator('[data-test="wishlist-item"]')
    .filter({ hasText: "Théière en fonte" });
  await expect(item).toBeVisible();

  // No confirmation is showing until the destructive action is reached for.
  await expect(item.locator('[data-test="inline-confirm"]')).toHaveCount(0);

  await item.locator('[data-test="wishlist-delete"]').click();
  await expect(item.locator('[data-test="inline-confirm"]')).toBeVisible();

  // The confirmation replaces the row's own actions rather than opening a modal.
  await expect(item.locator('[data-test="wishlist-edit"]')).toHaveCount(0);
  await expect(page.locator("dialog")).toHaveCount(0);

  await item.locator('[data-test="inline-confirm-cancel"]').click();
  await expect(item.locator('[data-test="inline-confirm"]')).toHaveCount(0);
  await expect(item.locator('[data-test="wishlist-edit"]')).toBeVisible();
  await expect(item).toBeVisible();

  const deleted = page.waitForResponse(
    (res) =>
      res.url().includes("/api/wishlists/me/items/") &&
      res.request().method() === "DELETE" &&
      res.status() === 200,
  );
  await item.locator('[data-test="wishlist-delete"]').click();
  await item.locator('[data-test="inline-confirm-accept"]').click();
  await deleted;

  await expect(item).toHaveCount(0);
});

test("the inline editor refuses an empty title in the field itself", async ({
  page,
}) => {
  await registerUser(page);
  await addWishlistItem(page, { title: "Carnet de notes" });

  // Located by data-title, not by text: once the editor opens the title lives in
  // an input value, and a hasText filter would stop matching the row.
  const item = page.locator(
    '[data-test="wishlist-item"][data-title="Carnet de notes"]',
  );
  await item.locator('[data-test="wishlist-edit"]').click();

  await item.locator('input[name="title"]').fill("");
  await item.locator('[data-test="wishlist-edit-save"]').click();

  await expect(item.locator('[data-test="field-error"]')).toHaveText(
    "Le titre est obligatoire.",
  );
  await expect(item.locator('input[name="title"]')).toHaveAttribute(
    "aria-invalid",
    "true",
  );

  await item.locator('input[name="title"]').fill("Carnet de notes A5");
  await expect(item.locator('[data-test="field-error"]')).toHaveCount(0);
});
