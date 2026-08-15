import { test, expect } from "@playwright/test";
import { registerUser } from "./helpers";

const PRODUCT_URL = "https://shop.example/chaise";

/** The preview endpoint reaches the open internet, which CI does not have.
 *  The contract under test is what the UI does with the answer, so the answer
 *  is stubbed. */
async function stubPreview(
  page: import("@playwright/test").Page,
  body: { title: string | null; price_eur: number | null },
) {
  await page.route("**/api/wishlists/me/items/preview", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...body, image_url: null }),
    }),
  );
}

async function paste(
  page: import("@playwright/test").Page,
  selector: string,
  text: string,
) {
  await page.locator(selector).focus();
  await page.evaluate(
    ({ selector, text }) => {
      const input = document.querySelector(selector) as HTMLInputElement;
      const data = new DataTransfer();
      data.setData("text", text);
      input.dispatchEvent(
        new ClipboardEvent("paste", { clipboardData: data, bubbles: true }),
      );
      input.value = text;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    },
    { selector, text },
  );
}

test("a pasted link fills the item in", async ({ page }) => {
  await registerUser(page);
  await stubPreview(page, { title: "Chaise en chêne", price_eur: 129.9 });

  await page.goto("/me");
  await paste(page, '[data-test="quick-add-entry"]', PRODUCT_URL);

  await expect(page.locator('[data-test="quick-add-entry"]')).toHaveValue(
    "Chaise en chêne",
  );
  await expect(page.locator('[data-test="quick-add-details"]')).toBeVisible();
  await expect(page.locator('[data-test="item-url"]')).toHaveValue(PRODUCT_URL);
  await expect(page.locator('[data-test="item-price"]')).toHaveValue("129.9");

  await page.click('[data-test="wishlist-add-submit"]');

  const item = page
    .locator('[data-test="wishlist-item"]')
    .filter({ hasText: "Chaise en chêne" });
  await expect(item).toBeVisible();
  await expect(item.locator(`a[href="${PRODUCT_URL}"]`)).toBeVisible();
});

test("the preview never overrides what the user already typed", async ({
  page,
}) => {
  await registerUser(page);
  await stubPreview(page, { title: "Chaise en chêne", price_eur: 129.9 });

  await page.goto("/me");
  await page.click('[data-test="quick-add-toggle"]');
  await page.fill('[data-test="item-price"]', "80");
  await page.fill('[data-test="item-url"]', "https://shop.example/autre");
  await page.fill('[data-test="item-notes"]', "en bleu");

  await paste(page, '[data-test="quick-add-entry"]', PRODUCT_URL);
  await expect(page.locator('[data-test="quick-add-entry"]')).toHaveValue(
    "Chaise en chêne",
  );

  await expect(page.locator('[data-test="item-price"]')).toHaveValue("80");
  await expect(page.locator('[data-test="item-url"]')).toHaveValue(
    "https://shop.example/autre",
  );
  await expect(page.locator('[data-test="item-notes"]')).toHaveValue("en bleu");
});

test("a preview that fails degrades to the URL, with no error shown", async ({
  page,
}) => {
  await registerUser(page);
  await page.route("**/api/wishlists/me/items/preview", (route) =>
    route.abort(),
  );

  await page.goto("/me");
  await paste(page, '[data-test="quick-add-entry"]', PRODUCT_URL);
  await page.click('[data-test="wishlist-add-submit"]');

  const item = page
    .locator('[data-test="wishlist-item"]')
    .filter({ hasText: PRODUCT_URL });
  await expect(item).toBeVisible();
  await expect(item.locator(`a[href="${PRODUCT_URL}"]`)).toBeVisible();
  await expect(page.getByText("Une erreur est survenue.")).toHaveCount(0);
});

test("plain text never calls the preview endpoint", async ({ page }) => {
  await registerUser(page);

  let calls = 0;
  await page.route("**/api/wishlists/me/items/preview", (route) => {
    calls += 1;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ title: null, price_eur: null, image_url: null }),
    });
  });

  await page.goto("/me");
  await paste(page, '[data-test="quick-add-entry"]', "plaid tout doux");
  await page.click('[data-test="wishlist-add-submit"]');

  await expect(
    page.locator('[data-test="wishlist-item"]').filter({
      hasText: "plaid tout doux",
    }),
  ).toBeVisible();
  expect(calls).toBe(0);
});
