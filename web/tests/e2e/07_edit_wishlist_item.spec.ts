import { test, expect } from "@playwright/test";
import { registerUser, createFamily, addWishlistItem } from "./helpers";

// Ensure wishlist items can be edited inline with updated fields reflected in UI
// and persisted via the API.
test("edit an existing wishlist item", async ({ page }) => {
  await registerUser(page);
  await createFamily(page, "Inline Edit Family");

  await addWishlistItem(page, {
    title: "Retro Camera",
    url: "https://example.com/camera",
    price: 150,
    priority: 4,
    notes: "Film preferred",
  });

  const item = page.locator("li", { hasText: "Retro Camera" });
  await expect(item).toBeVisible();

  await item.locator('button:has-text("Modifier")').click();

  await item.locator('input[name="title"]').fill("Retro Camera Pro");
  await item
    .locator('input[name="url"]')
    .fill("https://example.com/camera-pro");
  await item.locator('input[name="price_eur"]')
    .fill("249");
  await item.locator('input[name="priority"]').fill("2");
  await item.locator('textarea[name="notes"]').fill("Now with better lens");

  const saveResponse = page.waitForResponse(
    (res) =>
      res.url().includes("/api/wishlists/me/items/") &&
      res.request().method() === "PATCH" &&
      res.status() === 200,
  );
  await item.locator('button:has-text("Enregistrer")').click();
  await saveResponse;

  await expect(item.locator("text=Retro Camera Pro")).toBeVisible({ timeout: 10000 });
  await expect(
    item.locator('a[href="https://example.com/camera-pro"]'),
  ).toBeVisible();
  await expect(item.locator("text=249")).toBeVisible();
  await expect(item.locator("text=P2")).toBeVisible();
  await expect(item.locator("text=Now with better lens")).toBeVisible();
});
