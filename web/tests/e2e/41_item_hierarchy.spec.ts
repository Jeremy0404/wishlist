import { expect, test, type Browser } from "@playwright/test";
import { addWishlistItem, createFamily, joinFamily, registerUser } from "./helpers";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

async function ownerAndViewer(browser: Browser) {
  const owner = await (await browser.newContext()).newPage();
  const viewer = await (await browser.newContext()).newPage();
  await registerUser(owner);
  const { inviteCode } = await createFamily(owner, "Hierarchy Family");
  const ownerId = (await (await owner.request.get("/api/auth/me")).json()).id;
  await registerUser(viewer);
  await joinFamily(viewer, inviteCode);
  return { owner, viewer, ownerId };
}

test("price and buying notes each get their own line on someone's list", async ({
  browser,
}) => {
  const { owner, viewer, ownerId } = await ownerAndViewer(browser);
  const wish = await addWishlistItem(owner, {
    title: "Pull col roulé",
    price: 59,
    notes: "Taille M, couleur vert sapin",
  });

  await viewer.goto(`/wishlists/${ownerId}`);
  const card = viewer.locator(`[data-test="wishlist-item"][data-id="${wish.id}"]`);
  await expect(card.locator('[data-test="wishlist-price"]')).toHaveText(/59,00\s€/);
  await expect(card.locator('[data-test="wishlist-notes"]')).toHaveText(
    "Taille M, couleur vert sapin",
  );
});

test("a placeholder keeps its colour when another wish is removed", async ({ page }) => {
  await registerUser(page);
  await addWishlistItem(page, { title: "Bougie" });
  const kept = await addWishlistItem(page, { title: "Carafe" });
  const newest = await addWishlistItem(page, { title: "Plaid" });

  const placeholder = page.locator(
    `[data-test="wishlist-item"][data-id="${kept.id}"] [data-test="item-placeholder"]`,
  );
  const before = await placeholder.getAttribute("class");

  const removed = await page.request.delete(`/api/wishlists/me/items/${newest.id}`);
  expect(removed.ok()).toBe(true);
  await page.reload();

  await expect(placeholder).toHaveAttribute("class", before!);
});

test("a wish's photo opens larger on someone's list", async ({ browser }) => {
  const { owner, viewer, ownerId } = await ownerAndViewer(browser);
  const created = await owner.request.post("/api/wishlists/me/items", {
    multipart: {
      title: "Vase en grès",
      image: { name: "vase.png", mimeType: "image/png", buffer: PNG },
    },
  });
  expect(created.status()).toBe(201);
  const wish = await created.json();

  await viewer.goto(`/wishlists/${ownerId}`);
  const card = viewer.locator(`[data-test="wishlist-item"][data-id="${wish.id}"]`);
  await card.locator('[data-test="item-photo-open"]').click();

  const sheet = viewer.locator('[data-test="sheet"]');
  await expect(sheet).toContainText("Vase en grès");
  await expect(sheet.locator('[data-test="item-photo-large"]')).toBeVisible();
});
