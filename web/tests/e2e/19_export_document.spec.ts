import { test, expect } from "@playwright/test";
import type { Download, Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { addWishlistItemViaForm, registerUser } from "./helpers";

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

async function download(page: Page, format: string): Promise<Download> {
  await page.click('[data-test="wishlist-export"]');
  const started = page.waitForEvent("download");
  await page.click(`[data-test="wishlist-export-${format}"]`);
  return started;
}

async function read(file: Download) {
  return readFile((await file.path()) as string);
}

test("the export button opens a menu of the two formats", async ({ page }) => {
  await registerUser(page, OWNER);
  await addWishlistItemViaForm(page, { title: "Plaid tout doux" });

  const menu = page.locator('[data-test="wishlist-export-menu"]');
  await expect(menu).toHaveCount(0);

  await page.click('[data-test="wishlist-export"]');
  await expect(menu).toBeVisible();
  await expect(menu.locator('[data-test="wishlist-export-pdf"]')).toHaveText(
    "Télécharger le PDF",
  );
  await expect(
    menu.locator('[data-test="wishlist-export-markdown"]'),
  ).toHaveText("Télécharger le Markdown");

  await page.click('[data-test="wishlist-export"]');
  await expect(menu).toHaveCount(0);
});

test("the Markdown document is the four-column table from the mock", async ({
  page,
}) => {
  await registerUser(page, OWNER);
  await addPhotoItem(page, "Casque audio");
  await addWishlistItemViaForm(page, { title: "Livre de cuisine" });

  const file = await download(page, "markdown");
  expect(file.suggestedFilename()).toBe("wishlist.md");
  const markdown = (await read(file)).toString("utf8");

  expect(markdown).toContain("**Wishlist**");
  expect(markdown).toContain(`# La wishlist de ${OWNER}`);
  expect(markdown).toMatch(/\*Exporté le \d+ \S+ \d{4}\*/);
  expect(markdown).toContain("| Photo | Article | Prix | Priorité |");
  expect(markdown).toMatch(
    /\| !\[]\(https?:\/\/[^)]+\/api\/uploads\/[0-9a-f]{32}\.png\) \| Casque audio \| 79,00\s?€ \| Priorité haute \|/,
  );
  // No photo and no price both fall back to the em dash.
  expect(markdown).toMatch(/\| — \| Livre de cuisine \| — \| \S/);
  expect(markdown).not.toMatch(/\/5/);
  expect(markdown).toMatch(/Exporté depuis Wishlist le \d+ \S+ \d{4}/);
});

test("the PDF embeds the brand mark and the stored photo", async ({ page }) => {
  await registerUser(page, OWNER);
  await addPhotoItem(page, "Casque audio");

  const file = await download(page, "pdf");
  expect(file.suggestedFilename()).toBe("wishlist.pdf");
  const pdf = (await read(file)).toString("latin1");

  expect(pdf.startsWith("%PDF-")).toBe(true);
  // Two XObjects: nothing else can produce them but the mark and the photo.
  expect(pdf.match(/\/Subtype \/Image/g)).toHaveLength(2);
  expect(pdf).toContain("/Filter /DCTDecode");
});

test("a linked photo is not fetched for the PDF, and prints an em dash", async ({
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

  const markdown = (await read(await download(page, "markdown"))).toString(
    "utf8",
  );
  expect(markdown).toContain("| ![](https://example.invalid/photo.png) |");

  const pdf = (await read(await download(page, "pdf"))).toString("latin1");
  // Only the brand mark: the remote link is never fetched to be embedded.
  expect(pdf.match(/\/Subtype \/Image/g)).toHaveLength(1);
});
