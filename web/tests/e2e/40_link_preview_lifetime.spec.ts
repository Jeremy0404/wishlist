import { expect, test, type Page, type Route } from "@playwright/test";
import { openAddSheet, registerUser } from "./helpers";

const OLD_LINK = "https://shop.test/chaise";
const NEW_LINK = "https://shop.test/lampe";
const ENTRY = '[data-test="quick-add-entry"]';

type Preview = { title: string; price_eur: number };

async function holdPreviews(page: Page) {
  const held: Route[] = [];
  await page.route("**/api/wishlists/me/items/preview", (route) => {
    held.push(route);
  });
  return held;
}

function answer(route: Route, preview: Preview) {
  return route.fulfill({ json: { image_url: null, ...preview } });
}

async function paste(page: Page, text: string) {
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
    { selector: ENTRY, text },
  );
}

test("a preview answering after the sheet was reopened fills nothing", async ({ page }) => {
  await registerUser(page);
  const held = await holdPreviews(page);

  await openAddSheet(page);
  await paste(page, OLD_LINK);
  await expect.poll(() => held.length).toBe(1);

  await page.keyboard.press("Escape");
  await openAddSheet(page);
  await answer(held[0], { title: "Chaise en chêne", price_eur: 99 });

  await expect(page.locator(ENTRY)).toHaveValue("");
  await expect(page.locator('[data-test="quick-add-details"]')).toHaveCount(0);
  await expect(page.locator('[data-test="quick-add-resolving"]')).toHaveCount(0);
});

test("only the latest pasted link fills the form", async ({ page }) => {
  await registerUser(page);
  const held = await holdPreviews(page);

  await openAddSheet(page);
  await paste(page, OLD_LINK);
  await paste(page, NEW_LINK);
  await expect.poll(() => held.length).toBe(2);

  await answer(held[0], { title: "Chaise en chêne", price_eur: 99 });
  await answer(held[1], { title: "Lampe en laiton", price_eur: 20 });

  await expect(page.locator(ENTRY)).toHaveValue("Lampe en laiton");
  await expect(page.locator('[data-test="item-price"]')).toHaveValue("20");
  await expect(page.locator('[data-test="item-url"]')).toHaveValue(NEW_LINK);
});

test("submitting twice while a link resolves adds the wish once", async ({ page }) => {
  await registerUser(page);
  const held = await holdPreviews(page);
  let created = 0;
  page.on("request", (req) => {
    if (req.method() === "POST" && req.url().endsWith("/api/wishlists/me/items")) created++;
  });

  await openAddSheet(page);
  await page.fill(ENTRY, NEW_LINK);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect.poll(() => held.length).toBeGreaterThan(0);
  for (const route of held) await answer(route, { title: "Lampe en laiton", price_eur: 20 });

  await expect(page.locator('[data-test="wishlist-item"]')).toHaveCount(1);
  expect(created).toBe(1);
});
