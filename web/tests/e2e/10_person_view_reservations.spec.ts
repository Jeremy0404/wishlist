import { expect, test } from "@playwright/test";
import { addWishlistItem, createFamily, joinFamily, registerUser } from "./helpers";

test("person view renders every reservation state and the counter", async ({
  browser,
}) => {
  const owner = await (await browser.newContext()).newPage();
  const viewer = await (await browser.newContext()).newPage();
  const other = await (await browser.newContext()).newPage();

  await registerUser(owner);
  const { inviteCode } = await createFamily(owner, "Person View Family");

  const openItem = await addWishlistItem(owner, {
    title: "Appareil photo instantané",
    price: 79,
    notes: "N'importe quelle couleur, mais pastel serait sympa",
  });
  const mineItem = await addWishlistItem(owner, { title: "Cocotte en fonte" });
  const otherItem = await addWishlistItem(owner, { title: "Jeu de société" });

  await registerUser(viewer);
  await joinFamily(viewer, inviteCode);
  // Browsing another list requires a list of at least three items of your own
  await addWishlistItem(viewer, { title: "Chaise" });
  await addWishlistItem(viewer, { title: "Bureau" });
  await addWishlistItem(viewer, { title: "Lampe de bureau" });

  await registerUser(other);
  await joinFamily(other, inviteCode);
  await addWishlistItem(other, { title: "Lampe" });

  const reserved = await other.request.post(
    `/api/wishlists/items/${otherItem.id}/reserve`,
  );
  expect(reserved.status()).toBe(200);

  const ownerId = (await (await owner.request.get("/api/auth/me")).json()).id;
  await viewer.goto(`/wishlists/${ownerId}`);

  const card = (id: string) =>
    viewer.locator(`[data-test="wishlist-item"][data-id="${id}"]`);

  // Title, notes and price all render
  await expect(card(openItem.id)).toContainText("Appareil photo instantané");
  await expect(card(openItem.id)).toContainText("pastel serait sympa");
  await expect(card(openItem.id)).toContainText("79");

  // Reserved by someone else: a neutral tag naming the reserver, no controls
  await expect(card(otherItem.id).locator('[data-test="wishlist-status"]')).toContainText(
    "Réservé par Test User",
  );
  await expect(card(otherItem.id).locator("button")).toHaveCount(0);

  // The counter only counts items with no reservation
  await expect(viewer.locator("text=2 sur 3 encore à prendre")).toBeVisible();

  // Open -> reserved by the viewer
  await card(mineItem.id).locator('[data-test="wishlist-reserve"]').click();
  await expect(card(mineItem.id).locator('[data-test="wishlist-status"]')).toHaveText(
    "Réservé par toi",
  );
  await expect(viewer.locator("text=1 sur 3 encore à prendre")).toBeVisible();

  // Reserved -> purchased: the tag changes and "Marquer acheté" disappears
  await card(mineItem.id).locator('[data-test="wishlist-purchase"]').click();
  await expect(card(mineItem.id).locator('[data-test="wishlist-status"]')).toHaveText(
    "Acheté — bien joué",
  );
  await expect(card(mineItem.id).locator('[data-test="wishlist-purchase"]')).toHaveCount(0);

  // "Annuler" is still offered on a purchased item, and releases it
  await card(mineItem.id).locator('[data-test="wishlist-unreserve"]').click();
  await expect(card(mineItem.id).locator('[data-test="wishlist-reserve"]')).toBeVisible();
  await expect(viewer.locator("text=2 sur 3 encore à prendre")).toBeVisible();
});
