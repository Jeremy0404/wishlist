import { test, expect } from "@playwright/test";
import type { Download, Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { openAccount, registerUser } from "./helpers";

/** A 1x1 transparent PNG — the smallest thing the API will accept as an image. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

const OWNER = "Alexa Fixture";

async function addPhotoItem(page: Page, title: string) {
  await page.goto("/me");
  await page.fill('[data-test="quick-add-entry"]', title);
  await page.click('[data-test="quick-add-toggle"]');
  await page.fill('[data-test="item-price"]', "79");
  await page.selectOption('[data-test="item-priority"]', "1");
  await page.setInputFiles('[data-test="item-image-file"]', {
    name: "photo.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await expect(page.locator('[data-test="item-image-preview"]')).toBeVisible();

  const created = page.waitForResponse(
    (res) =>
      res.url().includes("/api/wishlists/me/items") &&
      res.request().method() === "POST" &&
      res.status() === 201,
  );
  await page.click('[data-test="wishlist-add-submit"]');
  await created;
}

async function print(page: Page): Promise<Download> {
  await openAccount(page);
  const button = page.locator('[data-test="account-print"]');
  await expect(button).toBeEnabled();
  const started = page.waitForEvent("download");
  await button.click();
  return started;
}

async function read(file: Download) {
  return readFile((await file.path()) as string);
}

test("printing sits in the account menu, and waits for a first wish", async ({
  page,
}) => {
  await registerUser(page, OWNER);

  await openAccount(page);
  await expect(page.locator('[data-test="account-print"]')).toHaveText(
    "Imprimer ma liste",
  );
  await expect(page.locator('[data-test="account-print"]')).toBeDisabled();
});

test("the PDF embeds the brand mark and the stored photo", async ({ page }) => {
  await registerUser(page, OWNER);
  await addPhotoItem(page, "Casque audio");

  const file = await print(page);
  expect(file.suggestedFilename()).toBe("wishlist.pdf");
  const pdf = (await read(file)).toString("latin1");

  expect(pdf.startsWith("%PDF-")).toBe(true);
  // Two XObjects: nothing else can produce them but the mark and the photo.
  expect(pdf.match(/\/Subtype \/Image/g)).toHaveLength(2);
  expect(pdf).toContain("/Filter /DCTDecode");
});

test("a linked photo is not fetched for the PDF", async ({
  page,
}) => {
  await registerUser(page, OWNER);
  await page.goto("/me");
  await page.fill('[data-test="quick-add-entry"]', "Écharpe");
  await page.click('[data-test="quick-add-toggle"]');
  await page.fill(
    '[data-test="item-image-url"]',
    "https://example.invalid/photo.png",
  );
  const created = page.waitForResponse(
    (res) =>
      res.url().includes("/api/wishlists/me/items") &&
      res.request().method() === "POST" &&
      res.status() === 201,
  );
  await page.click('[data-test="wishlist-add-submit"]');
  await created;

  const pdf = (await read(await print(page))).toString("latin1");
  // Only the brand mark: the remote link is never fetched to be embedded.
  expect(pdf.match(/\/Subtype \/Image/g)).toHaveLength(1);
});
