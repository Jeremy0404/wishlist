import { expect, test, type Browser, type Page } from "@playwright/test";
import { createFamily, joinFamily, registerUser } from "./helpers";

const WISHES = [
  { title: "Tasse", price_eur: 30 },
  { title: "Écharpe", price_eur: 10 },
  { title: "Livre" },
  { title: "Bougie", price_eur: 20 },
  { title: "Plante", price_eur: 45 },
  { title: "Gants", price_eur: 15 },
];

async function familyLists(browser: Browser, wishes: typeof WISHES) {
  const owner = await (await browser.newContext()).newPage();
  const viewer = await (await browser.newContext()).newPage();
  await registerUser(owner);
  const { inviteCode } = await createFamily(owner, "Filter Family");
  const ids: Record<string, string> = {};
  for (const wish of wishes) {
    const res = await owner.request.post("/api/wishlists/me/items", { data: wish });
    expect(res.status()).toBe(201);
    ids[wish.title] = (await res.json()).id;
  }
  const ownerId = (await (await owner.request.get("/api/auth/me")).json()).id;
  await registerUser(viewer);
  await joinFamily(viewer, inviteCode);
  return { viewer, ownerId, ids };
}

function titles(page: Page) {
  return page.locator('[data-test="wishlist-item"]').evaluateAll((cards) =>
    cards.map((card) => card.querySelector("span.min-w-0")?.textContent?.trim()),
  );
}

test("a long list can be narrowed to what is free or what I give", async ({ browser }) => {
  const { viewer, ownerId, ids } = await familyLists(browser, WISHES);
  for (const title of ["Tasse", "Livre"]) {
    const res = await viewer.request.post(`/api/wishlists/items/${ids[title]}/reserve`);
    expect(res.status()).toBe(200);
  }

  await viewer.goto(`/wishlists/${ownerId}`);
  const cards = viewer.locator('[data-test="wishlist-item"]');
  await expect(cards).toHaveCount(6);

  await viewer.click('[data-test="filter-open"]');
  await expect(cards).toHaveCount(4);
  await expect(cards.locator('[data-test="wishlist-reserve"]')).toHaveCount(4);

  await viewer.click('[data-test="filter-mine"]');
  await expect(cards).toHaveCount(2);
  await expect(viewer.locator('[data-test="filter-mine"]')).toHaveAttribute("aria-pressed", "true");

  await viewer.click('[data-test="filter-all"]');
  await expect(cards).toHaveCount(6);
});

test("sorting by price puts wishes without a price last", async ({ browser }) => {
  const { viewer, ownerId } = await familyLists(browser, WISHES);

  await viewer.goto(`/wishlists/${ownerId}`);
  await viewer.click('[data-test="sort-price"]');

  await expect.poll(() => titles(viewer)).toEqual([
    "Écharpe",
    "Gants",
    "Bougie",
    "Tasse",
    "Plante",
    "Livre",
  ]);
});

test("a filter with nothing in it offers a way back", async ({ browser }) => {
  const { viewer, ownerId } = await familyLists(browser, WISHES);

  await viewer.goto(`/wishlists/${ownerId}`);
  await viewer.click('[data-test="filter-mine"]');
  await expect(viewer.locator('[data-test="filter-empty"]')).toBeVisible();

  await viewer.click('[data-test="filter-reset"]');
  await expect(viewer.locator('[data-test="wishlist-item"]')).toHaveCount(6);
});

test("a short list shows no filters", async ({ browser }) => {
  const { viewer, ownerId } = await familyLists(browser, WISHES.slice(0, 3));

  await viewer.goto(`/wishlists/${ownerId}`);
  await expect(viewer.locator('[data-test="wishlist-item"]')).toHaveCount(3);
  await expect(viewer.locator('[data-test="gift-filters"]')).toHaveCount(0);
});
