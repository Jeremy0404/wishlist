import { expect, test } from "@playwright/test";
import { addWishlistItemViaForm, createFamily, registerUser } from "./helpers";

test("user stays authenticated after reload and can keep using wishlist", async ({ page }) => {
  await registerUser(page);
  await createFamily(page);

  const itemTitle = "Persisted Gadget";
  await addWishlistItemViaForm(page, { title: itemTitle });

  // Reload the page to ensure auth/session state survives a full refresh
  await page.reload();

  await expect(
    page.locator('[data-test="wishlist-item"]').filter({ hasText: itemTitle }),
  ).toBeVisible({ timeout: 15000 });

  // Navigate to another protected page to confirm the session is still valid
  await page.goto("/wishlists");
  await expect(page).toHaveURL(/\/wishlists/);
});
