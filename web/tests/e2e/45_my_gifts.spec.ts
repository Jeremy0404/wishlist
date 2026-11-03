import { expect, test } from "@playwright/test";
import { createFamily, joinFamily, registerUser } from "./helpers";

test("everything I give, across the family, in one place", async ({ browser }) => {
  const lina = await (await browser.newContext()).newPage();
  const noah = await (await browser.newContext()).newPage();
  const giver = await (await browser.newContext()).newPage();

  await registerUser(lina, "Lina Gift");
  const { inviteCode } = await createFamily(lina, "Gift Family");
  await registerUser(noah, "Noah Gift");
  await joinFamily(noah, inviteCode);
  await registerUser(giver, "Giver Gift");
  await joinFamily(giver, inviteCode);

  const wish = async (owner: typeof lina, data: { title: string; price_eur?: number }) =>
    (await (await owner.request.post("/api/wishlists/me/items", { data })).json()).id;
  const linaWish = await wish(lina, { title: "Carnet", price_eur: 12 });
  await wish(lina, { title: "Stylo" });
  const noahWish = await wish(noah, { title: "Ballon", price_eur: 25 });

  for (const id of [linaWish, noahWish]) {
    const res = await giver.request.post(`/api/wishlists/items/${id}/reserve`);
    expect(res.status()).toBe(200);
  }

  await giver.goto("/wishlists");
  await expect(giver.locator('[data-test="gifts-open"]')).toContainText("2 cadeaux");
  await giver.click('[data-test="gifts-open"]');

  const groups = giver.locator('[data-test="gift-group"]');
  await expect(groups).toHaveCount(2);
  await expect(groups.nth(0)).toContainText("Lina Gift");
  await expect(groups.nth(0)).toContainText("Carnet");
  await expect(groups.nth(0)).not.toContainText("Stylo");
  await expect(groups.nth(1)).toContainText("Ballon");
  await expect(giver.locator('[data-test="gifts-total"]')).toHaveText(/37,00\s€/);
});

test("the gifts endpoint never shows an owner their own reservations", async ({ browser }) => {
  const owner = await (await browser.newContext()).newPage();
  const giver = await (await browser.newContext()).newPage();

  await registerUser(owner);
  const { inviteCode } = await createFamily(owner, "Gift Secret Family");
  await registerUser(giver);
  await joinFamily(giver, inviteCode);

  const created = await owner.request.post("/api/wishlists/me/items", {
    data: { title: "Montre" },
  });
  const { id } = await created.json();
  expect((await giver.request.post(`/api/wishlists/items/${id}/reserve`)).status()).toBe(200);

  const ownersView = await owner.request.get("/api/wishlists/gifts");
  expect(ownersView.status()).toBe(200);
  expect(await ownersView.json()).toEqual([]);
});

test("with nothing reserved, the page points back to the family lists", async ({ page }) => {
  await registerUser(page);
  await createFamily(page, "Empty Gift Family");

  await page.goto("/wishlists");
  await expect(page.locator('[data-test="gifts-open"]')).toHaveCount(0);

  await page.goto("/wishlists/gifts");
  await expect(page.locator('[data-test="empty-state"]')).toContainText(
    "Tu n’offres rien pour l’instant.",
  );
});
