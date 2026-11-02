import { expect, test, type Page } from "@playwright/test";
import { openAddSheet, registerUser } from "./helpers";

const ENTRY = '[data-test="quick-add-entry"]';
const SHEET = '[data-test="sheet"]';

async function tapBesideSheet(page: Page) {
  await page.mouse.click(8, 8);
}

test("the entry hint promises an attempt, not a result", async ({ page }) => {
  await registerUser(page);
  await openAddSheet(page);
  await expect(page.locator(SHEET)).toContainText(
    "Colle un lien : on essaie de récupérer les détails, tu pourras les compléter.",
  );
});

test("a page that tells nothing earns a quiet manual-entry hint", async ({ page }) => {
  await registerUser(page);
  await page.route("**/api/wishlists/me/items/preview", (route) =>
    route.fulfill({ json: { title: null, price_eur: null, image_url: null } }),
  );

  await openAddSheet(page);
  await page.locator(ENTRY).focus();
  await page.evaluate(
    ({ selector, text }) => {
      const input = document.querySelector(selector) as HTMLInputElement;
      const data = new DataTransfer();
      data.setData("text", text);
      input.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true }));
      input.value = text;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    },
    { selector: ENTRY, text: "https://shop.test/bloque" },
  );

  await expect(page.locator('[data-test="quick-add-manual"]')).toHaveText(
    "Rien trouvé sur cette page. Tu peux compléter toi-même.",
  );
});

test("a tap beside the sheet keeps unsaved edits, but closes an untouched sheet", async ({
  page,
}) => {
  await registerUser(page);

  await openAddSheet(page);
  await tapBesideSheet(page);
  await expect(page.locator(SHEET)).toHaveCount(0);

  await openAddSheet(page);
  await page.fill(ENTRY, "Carnet de croquis");
  await tapBesideSheet(page);
  await expect(page.locator(SHEET)).toBeVisible();
  await expect(page.locator(ENTRY)).toHaveValue("Carnet de croquis");

  await page.click('[data-test="sheet-close"]');
  await expect(page.locator(SHEET)).toHaveCount(0);
});

test("the save button stays reachable with every detail open on a small screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await registerUser(page);

  await openAddSheet(page);
  await page.click('[data-test="quick-add-toggle"]');
  await expect(page.locator('[data-test="quick-add-details"]')).toBeVisible();

  await expect(page.locator('[data-test="wishlist-add-submit"]')).toBeInViewport({ ratio: 1 });
});
