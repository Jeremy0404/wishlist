import { expect, test, type Page } from "@playwright/test";
import { openAddSheet, registerUser } from "./helpers";

const TAB_PRESSES = 12;

function focusIsInSheet(page: Page) {
  return page.evaluate(
    () => !!document.activeElement?.closest('[data-test="sheet"]'),
  );
}

test("Tab and Shift+Tab stay inside an open sheet", async ({ page }) => {
  await registerUser(page);
  await openAddSheet(page);

  for (let i = 0; i < TAB_PRESSES; i++) {
    await page.keyboard.press("Tab");
    expect(await focusIsInSheet(page)).toBe(true);
  }
  for (let i = 0; i < TAB_PRESSES; i++) {
    await page.keyboard.press("Shift+Tab");
    expect(await focusIsInSheet(page)).toBe(true);
  }
});

test("the page behind an open sheet is inert and does not scroll", async ({ page }) => {
  await registerUser(page);
  await openAddSheet(page);

  await expect(page.locator("#app")).toHaveAttribute("inert", "");
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");

  await page.keyboard.press("Escape");
  await expect(page.locator('[data-test="sheet"]')).toHaveCount(0);
  await expect(page.locator("#app")).not.toHaveAttribute("inert", "");
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});

test("closing a sheet gives focus back to what opened it", async ({ page }) => {
  await registerUser(page);
  await openAddSheet(page);

  await page.click('[data-test="sheet-close"]');
  await expect(page.locator('[data-test="sheet"]')).toHaveCount(0);
  await expect(page.locator('[data-test="wishlist-add-open"]')).toBeFocused();
});
