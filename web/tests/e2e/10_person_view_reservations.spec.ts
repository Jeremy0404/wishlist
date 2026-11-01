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

  // Taken by someone else: said plainly, without naming them, and no controls
  await expect(card(otherItem.id).locator('[data-test="wishlist-status"]')).toHaveText(
    "Quelqu’un s’en occupe déjà",
  );
  await expect(card(otherItem.id).locator("button")).toHaveCount(0);

  // Open -> "Je l'offre" -> the viewer is giving it
  await expect(card(mineItem.id).locator('[data-test="wishlist-reserve"]')).toHaveText(
    "Je l’offre",
  );
  await card(mineItem.id).locator('[data-test="wishlist-reserve"]').click();
  await expect(card(mineItem.id).locator('[data-test="wishlist-status"]')).toHaveText(
    "Tu l’offres",
  );

  // An older "purchased" reservation reads the same way: there is one state
  const purchased = await viewer.request.post(
    `/api/wishlists/items/${mineItem.id}/purchase`,
  );
  expect(purchased.ok()).toBe(true);
  await viewer.reload();
  await expect(card(mineItem.id).locator('[data-test="wishlist-status"]')).toHaveText(
    "Tu l’offres",
  );

  // "Annuler" releases it
  await card(mineItem.id).locator('[data-test="wishlist-unreserve"]').click();
  await expect(card(mineItem.id).locator('[data-test="wishlist-reserve"]')).toBeVisible();
});
