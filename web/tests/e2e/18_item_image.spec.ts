import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { registerUser } from "./helpers";

/** A 1x1 transparent PNG — the smallest thing the API will accept as an image. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

const thumbnail = '[data-test="item-thumbnail"]';

async function addItem(
  page: Page,
  title: string,
  photo?: { name: string; mimeType: string; buffer: Buffer },
) {
  await page.goto("/me");
  await page.fill('[data-test="quick-add-entry"]', title);

  if (photo) {
    await page.click('[data-test="quick-add-toggle"]');
    await page.setInputFiles('[data-test="item-image-file"]', photo);
    await expect(
      page.locator('[data-test="item-image-preview"]'),
    ).toBeVisible();
  }

  const created = page.waitForResponse(
    (res) =>
      res.url().includes("/api/wishlists/me/items") &&
      res.request().method() === "POST" &&
      res.status() === 201,
  );
  await page.click('[data-test="wishlist-add-submit"]');
  await created;

  // data-title, not the rendered text: the row keeps it once the editor opens.
  return page.locator(`[data-test="wishlist-item"][data-title="${title}"]`);
}

test("an uploaded photo is stored, served and shown on the card", async ({
  page,
}) => {
  await registerUser(page);

  const item = await addItem(page, "Plaid tout doux", {
    name: "hostile ../../name.php",
    mimeType: "image/png",
    buffer: PNG,
  });

  const image = item.locator(thumbnail);
  await expect(image).toBeVisible();

  const src = await image.getAttribute("src");
  expect(src).toMatch(/^\/api\/uploads\/[0-9a-f]{32}\.png$/);
  await expect(image).toHaveCSS("width", "52px");
  await expect(image).toHaveCSS("height", "52px");
  await expect
    .poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth))
    .toBeGreaterThan(0);
});

test("an item with no photo renders no thumbnail slot", async ({ page }) => {
  await registerUser(page);

  const withImage = await addItem(page, "Avec photo", {
    name: "photo.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  const without = await addItem(page, "Sans photo");

  await expect(withImage.locator(thumbnail)).toHaveCount(1);
  await expect(without.locator(thumbnail)).toHaveCount(0);
});

test("a linked photo that fails to load leaves no broken image", async ({
  page,
}) => {
  await registerUser(page);

  await page.goto("/me");
  await page.fill('[data-test="quick-add-entry"]', "Lien cassé");
  await page.click('[data-test="quick-add-toggle"]');
  await page.fill('[data-test="item-image-url"]', "http://web/nowhere.png");
  await page.click('[data-test="wishlist-add-submit"]');

  const item = page
    .locator('[data-test="wishlist-item"]')
    .filter({ hasText: "Lien cassé" });
  await expect(item).toBeVisible();
  await expect(item.locator(thumbnail)).toHaveCount(0);
});

test("removing a photo deletes the stored file", async ({ page }) => {
  await registerUser(page);

  const item = await addItem(page, "Photo à retirer", {
    name: "photo.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  const src = await item.locator(thumbnail).getAttribute("src");
  expect(src).toBeTruthy();

  await item.locator('[data-test="wishlist-edit"]').click();
  await item.locator('[data-test="item-image-remove"]').click();

  const saved = page.waitForResponse(
    (res) =>
      res.url().includes("/api/wishlists/me/items/") &&
      res.request().method() === "PATCH" &&
      res.status() === 200,
  );
  await item.locator('[data-test="wishlist-edit-save"]').click();
  await saved;

  await expect(item.locator(thumbnail)).toHaveCount(0);

  const gone = await page.request.get(src!);
  expect(gone.status()).toBe(404);
});

test("a file that is not an image is refused", async ({ page }) => {
  await registerUser(page);

  await page.goto("/me");
  await page.fill('[data-test="quick-add-entry"]', "Faux fichier");
  await page.click('[data-test="quick-add-toggle"]');
  await page.setInputFiles('[data-test="item-image-file"]', {
    name: "invoice.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.7"),
  });

  await expect(
    page.locator('[data-test="quick-add-details"] [data-test="field-error"]'),
  ).toHaveText("Formats acceptés : PNG, JPEG, WebP ou GIF.");
  await expect(page.locator('[data-test="item-image-preview"]')).toHaveCount(0);
});

test("the shared page shows the photo at 56px", async ({ page }) => {
  await registerUser(page, "Élodie Martin");
  await addItem(page, "Cadeau illustré", {
    name: "photo.png",
    mimeType: "image/png",
    buffer: PNG,
  });

  const published = page.waitForResponse(
    (res) => res.url().includes("/api/wishlists/me/publish") && res.ok(),
  );
  await page.click('[data-test="share-visibility-shared"]');
  await published;

  const { wishlist } = await (
    await page.request.get("/api/wishlists/me")
  ).json();
  await page.goto(`/share/${wishlist.public_slug}`);

  const image = page.locator(thumbnail);
  await expect(image).toBeVisible();
  await expect(image).toHaveCSS("width", "56px");
  await expect(image).toHaveCSS("height", "56px");
});
