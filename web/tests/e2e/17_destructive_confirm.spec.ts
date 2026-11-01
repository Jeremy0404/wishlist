import { test, expect } from "@playwright/test";
import { addWishlistItem, registerUser } from "./helpers";

test("removing a wish asks first, and keeping it changes nothing", async ({
  page,
}) => {
  await registerUser(page);
  await addWishlistItem(page, { title: "Théière en fonte" });

  const item = page
    .locator('[data-test="wishlist-item"]')
    .filter({ hasText: "Théière en fonte" });
  await item.locator('[data-test="wishlist-edit"]').click();

  const sheet = page.locator('[data-test="sheet"]');
  // No confirmation is showing until the destructive action is reached for.
  await expect(sheet.locator('[data-test="inline-confirm"]')).toHaveCount(0);

  await sheet.locator('[data-test="wishlist-delete"]').click();
  const confirm = sheet.locator('[data-test="inline-confirm"]');
  await expect(confirm).toContainText(
    "Retirer « Théière en fonte » de ta liste ?",
  );
  // The confirmation replaces the remove button rather than opening a modal.
  await expect(sheet.locator('[data-test="wishlist-delete"]')).toHaveCount(0);
  await expect(page.locator("dialog")).toHaveCount(0);

  await confirm.locator('[data-test="inline-confirm-cancel"]').click();
  await expect(confirm).toHaveCount(0);
  await expect(sheet.locator('[data-test="wishlist-delete"]')).toBeVisible();

  const deleted = page.waitForResponse(
    (res) =>
      res.url().includes("/api/wishlists/me/items/") &&
      res.request().method() === "DELETE" &&
      res.status() === 200,
  );
  await sheet.locator('[data-test="wishlist-delete"]').click();
  await sheet.locator('[data-test="inline-confirm-accept"]').click();
  await deleted;

  await expect(sheet).toHaveCount(0);
  await expect(item).toHaveCount(0);
});

test("the editor refuses an empty name in the field itself", async ({
  page,
}) => {
  await registerUser(page);
  await addWishlistItem(page, { title: "Carnet de notes" });

  const item = page.locator(
    '[data-test="wishlist-item"][data-title="Carnet de notes"]',
  );
  await item.locator('[data-test="wishlist-edit"]').click();

  const sheet = page.locator('[data-test="sheet"]');
  await sheet.locator('input[name="title"]').fill("");
  await sheet.locator('[data-test="wishlist-edit-save"]').click();

  await expect(sheet.locator('[data-test="field-error"]')).toHaveText(
    "Il manque le nom.",
  );
  await expect(sheet.locator('input[name="title"]')).toHaveAttribute(
    "aria-invalid",
    "true",
  );

  await sheet.locator('input[name="title"]').fill("Carnet de notes A5");
  await expect(sheet.locator('[data-test="field-error"]')).toHaveCount(0);
});
