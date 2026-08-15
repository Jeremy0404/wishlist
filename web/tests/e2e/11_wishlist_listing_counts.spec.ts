import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { addWishlistItem, createFamily, joinFamily, registerUser } from "./helpers";

type ListingRow = {
  user_id: string;
  item_count: number;
  reserved_by_me_count: number;
};

async function userId(page: Page): Promise<string> {
  return (await (await page.request.get("/api/auth/me")).json()).id;
}

async function listing(page: Page): Promise<ListingRow[]> {
  const res = await page.request.get("/api/wishlists");
  expect(res.status()).toBe(200);
  return res.json();
}

test("the family listing counts items and the caller's own reservations", async ({
  browser,
}) => {
  const alice = await (await browser.newContext()).newPage();
  const bob = await (await browser.newContext()).newPage();
  const carol = await (await browser.newContext()).newPage();

  await registerUser(alice);
  const { inviteCode } = await createFamily(alice, "Counts Family");

  const aliceItems = [];
  for (const title of ["A1", "A2", "A3", "A4"]) {
    aliceItems.push(await addWishlistItem(alice, { title }));
  }

  await registerUser(bob);
  await joinFamily(bob, inviteCode);
  for (const title of ["B1", "B2", "B3"]) await addWishlistItem(bob, { title });

  await registerUser(carol);
  await joinFamily(carol, inviteCode);
  const carolItems = [];
  for (const title of ["C1", "C2", "C3"]) {
    carolItems.push(await addWishlistItem(carol, { title }));
  }

  const aliceId = await userId(alice);
  const bobId = await userId(bob);
  const carolId = await userId(carol);

  // Bob reserves two of Alice's items and one of Carol's
  for (const item of [aliceItems[0], aliceItems[1], carolItems[0]]) {
    const res = await bob.request.post(`/api/wishlists/items/${item.id}/reserve`);
    expect(res.status()).toBe(200);
  }

  // Carol reserves one of Alice's items — this must not show up as Bob's
  const carolReserve = await carol.request.post(
    `/api/wishlists/items/${aliceItems[2].id}/reserve`,
  );
  expect(carolReserve.status()).toBe(200);

  const rows = await listing(bob);

  // Bob's own list is absent, and no row carries anything about it
  expect(rows.map((r) => r.user_id).sort()).toEqual([aliceId, carolId].sort());
  expect(rows.some((r) => r.user_id === bobId)).toBe(false);

  const forBob = (id: string) => rows.find((r) => r.user_id === id)!;

  expect(forBob(aliceId).item_count).toBe(4);
  expect(forBob(aliceId).reserved_by_me_count).toBe(2);
  expect(forBob(carolId).item_count).toBe(3);
  expect(forBob(carolId).reserved_by_me_count).toBe(1);

  // Alice sees her own list nowhere, and Bob's reservations are not hers
  const aliceRows = await listing(alice);
  expect(aliceRows.some((r) => r.user_id === aliceId)).toBe(false);
  for (const row of aliceRows) expect(row.reserved_by_me_count).toBe(0);

  // Counts are numbers, not the strings pg returns for count(*)
  expect(typeof forBob(aliceId).item_count).toBe("number");
  expect(typeof forBob(aliceId).reserved_by_me_count).toBe("number");
});
