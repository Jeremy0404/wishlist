import { expect, test } from "@playwright/test";
import { addWishlistItem, createFamily, joinFamily, registerUser } from "./helpers";

test("the owner cannot learn their reservations through any wishlist endpoint", async ({
  browser,
}) => {
  const owner = await (await browser.newContext()).newPage();
  const giver = await (await browser.newContext()).newPage();
  const outsider = await (await browser.newContext()).newPage();

  await registerUser(owner);
  const { inviteCode } = await createFamily(owner, "Secret Family");
  const gift = await addWishlistItem(owner, { title: "Montre à gousset" });

  await registerUser(giver, "Secret Giver");
  await joinFamily(giver, inviteCode);
  const reserved = await giver.request.post(`/api/wishlists/items/${gift.id}/reserve`);
  expect(reserved.status()).toBe(200);

  const ownerId = (await (await owner.request.get("/api/auth/me")).json()).id;

  const ownList = await owner.request.get("/api/wishlists/me");
  expect(ownList.status()).toBe(200);
  const [ownItem] = (await ownList.json()).items;
  expect(ownItem.id).toBe(gift.id);
  for (const field of ["reserved", "reservation_status", "reserver_user_id", "reserver_name"])
    expect(ownItem).not.toHaveProperty(field);

  const throughMemberView = await owner.request.get(`/api/wishlists/${ownerId}`);
  expect(throughMemberView.status()).toBe(404);
  expect(await throughMemberView.text()).not.toContain("Secret Giver");

  await registerUser(outsider);
  await createFamily(outsider, "Other Family");
  const fromOtherFamily = await outsider.request.get(`/api/wishlists/${ownerId}`);
  expect(fromOtherFamily.status()).toBe(404);

  const fromGiver = await giver.request.get(`/api/wishlists/${ownerId}`);
  expect(fromGiver.status()).toBe(200);
  const [seenByGiver] = (await fromGiver.json()).items;
  expect(seenByGiver.reserved).toBe(true);
});
