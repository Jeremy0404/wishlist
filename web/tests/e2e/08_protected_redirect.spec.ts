import { test, expect } from "@playwright/test";
import { addWishlistItem, createFamily, logout, registerUser } from "./helpers";

test("protected route redirect returns to target after login", async ({ page }) => {
  const { email, password } = await registerUser(page);
  await createFamily(page, "Redirect Preserve Family");

  // Add items to ensure the /wishlists page is available after login
  await addWishlistItem(page, { title: "Board Game" });
  await addWishlistItem(page, { title: "Book" });
  await addWishlistItem(page, { title: "Headphones" });

  await logout(page);

  await page.goto("/wishlists");
  await expect(page).toHaveURL(/\/auth\/login\?redirect=/);

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/wishlists/);
});
