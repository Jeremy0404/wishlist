import { expect, test, type Browser } from "@playwright/test";
import { addWishlistItem, createFamily, joinFamily, registerUser } from "./helpers";

const CONCURRENT_ATTEMPTS = 8;

async function familyWithOneWish(browser: Browser) {
  const owner = await (await browser.newContext()).newPage();
  const first = await (await browser.newContext()).newPage();
  const second = await (await browser.newContext()).newPage();

  await registerUser(owner);
  const { inviteCode } = await createFamily(owner, "Race Family");
  const wish = await addWishlistItem(owner, { title: "Théière en fonte" });
  const ownerId = (await (await owner.request.get("/api/auth/me")).json()).id;

  for (const giver of [first, second]) {
    await registerUser(giver);
    await joinFamily(giver, inviteCode);
  }
  return { ownerId, wish, first, second };
}

test("simultaneous reservations: exactly one wins, the others get a conflict", async ({
  browser,
}) => {
  const { ownerId, wish, first, second } = await familyWithOneWish(browser);

  const attempts = Array.from({ length: CONCURRENT_ATTEMPTS }, (_, i) =>
    (i % 2 ? first : second).request.post(`/api/wishlists/items/${wish.id}/reserve`),
  );
  const statuses = (await Promise.all(attempts)).map((res) => res.status());

  expect(statuses.filter((s) => s === 200)).toHaveLength(1);
  expect(statuses.filter((s) => s === 409)).toHaveLength(CONCURRENT_ATTEMPTS - 1);

  const seen = await (await first.request.get(`/api/wishlists/${ownerId}`)).json();
  expect(seen.items[0].reserved).toBe(true);
});

test("losing the race says so and shows the wish as taken", async ({ browser }) => {
  const { ownerId, wish, first, second } = await familyWithOneWish(browser);

  await first.goto(`/wishlists/${ownerId}`);
  const card = first.locator(`[data-test="wishlist-item"][data-id="${wish.id}"]`);
  await expect(card.locator('[data-test="wishlist-reserve"]')).toBeVisible();

  const taken = await second.request.post(`/api/wishlists/items/${wish.id}/reserve`);
  expect(taken.status()).toBe(200);

  await card.locator('[data-test="wishlist-reserve"]').click();

  const toast = first.locator('[data-test="toast"]');
  await expect(toast).toHaveAttribute("data-kind", "error");
  await expect(toast).toHaveText("Quelqu’un vient de réserver cette envie");
  await expect(card.locator('[data-test="wishlist-status"]')).toHaveText(
    "Quelqu’un s’en occupe déjà",
  );
});

test("the action stays disabled while its request is in flight", async ({ browser }) => {
  const { ownerId, wish, first } = await familyWithOneWish(browser);

  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  await first.route("**/reserve", async (route) => {
    await held;
    await route.continue();
  });

  await first.goto(`/wishlists/${ownerId}`);
  const card = first.locator(`[data-test="wishlist-item"][data-id="${wish.id}"]`);
  await card.locator('[data-test="wishlist-reserve"]').click();
  await expect(card.locator('[data-test="wishlist-reserve"]')).toBeDisabled();

  release();
  await expect(card.locator('[data-test="wishlist-status"]')).toHaveText("Tu l’offres");
});
