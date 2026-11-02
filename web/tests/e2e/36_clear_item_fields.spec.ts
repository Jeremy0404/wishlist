import { expect, test, type Page } from "@playwright/test";
import { addWishlistItem, editWishlistItem, registerUser } from "./helpers";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

const DETAILS = {
  url: "https://shop.test/carnet",
  price: 24,
  notes: "Couverture lin, pages pointillées",
};

async function ownItem(page: Page, id: string) {
  const res = await page.request.get("/api/wishlists/me");
  expect(res.ok()).toBe(true);
  return (await res.json()).items.find((item: { id: string }) => item.id === id);
}

test("clearing the link, price and notes in the sheet removes them for good", async ({
  page,
}) => {
  await registerUser(page);
  const item = await addWishlistItem(page, { title: "Carnet", ...DETAILS });

  await editWishlistItem(page, "Carnet", {
    title: "Carnet",
    url: "",
    price: "",
    notes: "",
  });

  expect(await ownItem(page, item.id)).toMatchObject({
    url: null,
    price_eur: null,
    notes: null,
  });
  await page.reload();
  await expect(page.locator(`[data-test="wishlist-item"][data-id="${item.id}"]`)).not.toContainText(
    DETAILS.notes,
  );
});

test("a photo upload can clear the other fields in the same request", async ({ page }) => {
  await registerUser(page);
  const item = await addWishlistItem(page, { title: "Carnet", ...DETAILS });

  const res = await page.request.patch(`/api/wishlists/me/items/${item.id}`, {
    multipart: {
      url: "",
      price_eur: "",
      notes: "",
      image: { name: "photo.png", mimeType: "image/png", buffer: PNG },
    },
  });
  expect(res.status()).toBe(200);

  const updated = await ownItem(page, item.id);
  expect(updated).toMatchObject({ url: null, price_eur: null, notes: null });
  expect(updated.image_url).toMatch(/^\/uploads\/[0-9a-f]{32}\.png$/);
});

test("leaving a field out keeps its value", async ({ page }) => {
  await registerUser(page);
  const item = await addWishlistItem(page, { title: "Carnet", ...DETAILS });

  const res = await page.request.patch(`/api/wishlists/me/items/${item.id}`, {
    data: { title: "Carnet ligné" },
  });
  expect(res.status()).toBe(200);

  expect(await ownItem(page, item.id)).toMatchObject({
    title: "Carnet ligné",
    url: DETAILS.url,
    notes: DETAILS.notes,
  });
});
