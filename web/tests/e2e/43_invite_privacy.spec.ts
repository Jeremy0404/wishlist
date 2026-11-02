import { expect, test } from "@playwright/test";
import { createFamily, registerUser } from "./helpers";

test("inviting someone says who will see what", async ({ page }) => {
  await registerUser(page);
  await createFamily(page, "Privacy Family");

  await page.goto("/wishlists");
  await page.click('[data-test="browse-invite"]');

  await expect(page.locator('[data-test="invite-privacy"]')).toHaveText(
    "Ta famille verra ta liste et pourra t’offrir tes envies. Toi, tu ne sauras jamais qui offre quoi.",
  );
});
