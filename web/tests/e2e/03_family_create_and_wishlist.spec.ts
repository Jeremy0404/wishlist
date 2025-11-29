import { test, expect } from "@playwright/test";
import {
  addWishlistItemViaForm,
  createFamily,
  deleteWishlistItem,
  editWishlistItem,
  loginUser,
  logout,
  registerUser,
} from "./helpers";

test('complete family creation and wishlist management flow', async ({ page }) => {
  const { email, password } = await registerUser(page);

  await expect(page).toHaveURL(/\/family\/create/);

  const familyData = await createFamily(page, "Test Family");
  expect(familyData.inviteCode).toBeTruthy();
  expect(familyData.inviteCode.length).toBeGreaterThan(0);

  const originalTitle = `Nintendo Switch ${Date.now()}`;
  await addWishlistItemViaForm(page, {
    title: originalTitle,
    url: "https://example.com/switch",
    price: 299.99,
    priority: 1,
    notes: "Prefer OLED model in red",
  });

  await editWishlistItem(page, originalTitle, {
    title: `${originalTitle} Pro`,
    url: "https://example.com/switch-pro",
    price: 349.99,
    priority: 2,
    notes: "Prefer OLED model in red with case",
  });

  await logout(page);
  await loginUser(page, email, password);
  await page.goto("/me");
  await expect(page.locator("text=" + `${originalTitle} Pro`)).toBeVisible();

  await deleteWishlistItem(page, `${originalTitle} Pro`);
  await expect(
    page.locator('[data-test="wishlist-item"]').filter({ hasText: originalTitle }),
  ).toHaveCount(0);
});
