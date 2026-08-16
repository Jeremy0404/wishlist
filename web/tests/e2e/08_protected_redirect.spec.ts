import { test, expect } from "@playwright/test";
import {
  createFamily,
  logout,
  registerUser,
  usePasswordForm,
} from "./helpers";

test("protected route redirect returns to target after login", async ({ page }) => {
  const { email, password } = await registerUser(page);
  await createFamily(page, "Redirect Preserve Family");

  await logout(page);

  await page.goto("/wishlists");
  await expect(page).toHaveURL(/\/auth\/login\?redirect=/);

  await usePasswordForm(page);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/wishlists/);
});
