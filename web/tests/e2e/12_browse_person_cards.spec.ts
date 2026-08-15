import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { addWishlistItem, createFamily, joinFamily, registerUser } from "./helpers";

async function userId(page: Page): Promise<string> {
  return (await (await page.request.get("/api/auth/me")).json()).id;
}

test("browse shows a card per member with counts, and invites inline", async ({
  browser,
}) => {
  const alexa = await (await browser.newContext()).newPage();
  const bob = await (await browser.newContext()).newPage();
  const carol = await (await browser.newContext()).newPage();

  await registerUser(alexa, "Alexa Chen");
  const { inviteCode } = await createFamily(alexa, "Browse Family");
  const alexaItems = [];
  for (const title of ["A1", "A2", "A3", "A4"]) {
    alexaItems.push(await addWishlistItem(alexa, { title }));
  }

  await registerUser(bob, "Bob Marley");
  await joinFamily(bob, inviteCode);
  for (const title of ["B1", "B2", "B3"]) await addWishlistItem(bob, { title });

  await registerUser(carol, "Carol Okafor");
  await joinFamily(carol, inviteCode);
  for (const title of ["C1", "C2", "C3"]) await addWishlistItem(carol, { title });

  for (const item of [alexaItems[0], alexaItems[1]]) {
    const res = await bob.request.post(`/api/wishlists/items/${item.id}/reserve`);
    expect(res.status()).toBe(200);
  }

  const alexaId = await userId(alexa);
  await bob.goto("/wishlists");

  const cards = bob.locator('[data-test="browse-card"]');
  await expect(cards).toHaveCount(2);

  const alexaCard = cards.filter({ hasText: "Alexa Chen" });
  const carolCard = cards.filter({ hasText: "Carol Okafor" });

  // Counts come from the aggregates endpoint
  await expect(alexaCard.locator('[data-test="browse-summary"]')).toHaveText(
    "4 articles · 2 réservés par toi",
  );
  await expect(carolCard.locator('[data-test="browse-summary"]')).toHaveText(
    "3 articles · rien de réservé",
  );

  // Bob's own list is not a card here
  await expect(cards.filter({ hasText: "Bob Marley" })).toHaveCount(0);

  // Initials are derived client-side from the member's name
  await expect(alexaCard.getByText("AC", { exact: true })).toBeVisible();
  await expect(carolCard.getByText("CO", { exact: true })).toBeVisible();

  // The invite card opens the flow inline, without leaving the page
  await expect(bob.locator('[data-test="invite-code"]')).toHaveCount(0);
  await bob.locator('[data-test="browse-invite"]').click();
  await expect(bob.locator('[data-test="invite-code"]')).toHaveText(inviteCode);
  await expect(bob).toHaveURL(/\/wishlists$/);

  await bob.keyboard.press("Escape");
  await expect(bob.locator('[data-test="invite-code"]')).toHaveCount(0);

  // The grid reflows without pushing the page sideways
  for (const width of [360, 768, 1280]) {
    await bob.setViewportSize({ width, height: 900 });
    const overflows = await bob.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows, `horizontal scrolling at ${width}px`).toBe(false);
  }

  await alexaCard.locator('[data-test="wishlist-open"]').click();
  await expect(bob).toHaveURL(new RegExp(`/wishlists/${alexaId}$`));
});
