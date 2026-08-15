import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { addWishlistItem, createFamily, joinFamily, registerUser } from "./helpers";

async function userId(page: Page): Promise<string> {
  return (await (await page.request.get("/api/auth/me")).json()).id;
}

test("a family-less user owns a usable list that nobody else can see", async ({
  browser,
}) => {
  const loner = await (await browser.newContext()).newPage();
  const stranger = await (await browser.newContext()).newPage();

  await registerUser(loner, "Solo User");
  const lonerId = await userId(loner);

  // Create, edit and delete without ever touching a family
  const created = await addWishlistItem(loner, { title: "Objet solitaire" });
  const patched = await loner.request.patch(
    `/api/wishlists/me/items/${created.id}`,
    { data: { title: "Objet solitaire v2" } },
  );
  expect(patched.status()).toBe(200);

  const mine = await (await loner.request.get("/api/wishlists/me")).json();
  expect(mine.items.map((i: { title: string }) => i.title)).toEqual([
    "Objet solitaire v2",
  ]);
  expect(mine.wishlist.family_id).toBe(null);

  // The family-scoped endpoints refuse cleanly rather than blowing up
  for (const path of ["/api/wishlists", `/api/wishlists/${lonerId}`]) {
    const res = await loner.request.get(path);
    expect(res.status()).toBe(403);
  }
  const reserve = await loner.request.post(
    `/api/wishlists/items/${created.id}/reserve`,
  );
  expect(reserve.status()).toBe(403);

  // A stranger in their own family cannot see the family-less list
  await registerUser(stranger, "Nosy Stranger");
  await createFamily(stranger, "Nosy Family");
  for (const title of ["N1", "N2", "N3"]) {
    await addWishlistItem(stranger, { title });
  }

  const listing = await (await stranger.request.get("/api/wishlists")).json();
  expect(listing.some((r: { user_id: string }) => r.user_id === lonerId)).toBe(false);

  const direct = await stranger.request.get(`/api/wishlists/${lonerId}`);
  expect(direct.status()).toBe(404);

  const steal = await stranger.request.post(
    `/api/wishlists/items/${created.id}/reserve`,
  );
  expect(steal.status()).toBe(404);

  const del = await loner.request.delete(`/api/wishlists/me/items/${created.id}`);
  expect(del.status()).toBe(200);
});

test("a list filled before joining a family becomes that family's list", async ({
  browser,
}) => {
  const owner = await (await browser.newContext()).newPage();
  const joiner = await (await browser.newContext()).newPage();

  await registerUser(owner, "Family Owner");
  const { inviteCode } = await createFamily(owner, "Adoption Family");
  for (const title of ["O1", "O2", "O3"]) await addWishlistItem(owner, { title });

  // Fill the list first, join afterwards — the whole point of the change
  await registerUser(joiner, "Late Joiner");
  await addWishlistItem(joiner, { title: "Ajouté avant la famille" });
  const joinerId = await userId(joiner);

  await joinFamily(joiner, inviteCode);

  const mine = await (await joiner.request.get("/api/wishlists/me")).json();
  expect(mine.items.map((i: { title: string }) => i.title)).toEqual([
    "Ajouté avant la famille",
  ]);
  expect(mine.wishlist.family_id).not.toBe(null);

  // The item is now visible to the family, on the joiner's list
  const seen = await (await owner.request.get(`/api/wishlists/${joinerId}`)).json();
  expect(seen.items.map((i: { title: string }) => i.title)).toEqual([
    "Ajouté avant la famille",
  ]);
});
