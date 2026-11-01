import { expect, test } from "@playwright/test";
import { addWishlistItem, createFamily, joinFamily, registerUser } from "./helpers";

test("famille lists a member who has not added anything yet", async ({ browser }) => {
  const alexa = await (await browser.newContext()).newPage();
  const bob = await (await browser.newContext()).newPage();
  const carol = await (await browser.newContext()).newPage();

  await registerUser(alexa, "Alexa Chen");
  const { inviteCode } = await createFamily(alexa, "Members Family");

  await registerUser(bob, "Bob Marley");
  await joinFamily(bob, inviteCode);

  await registerUser(carol, "Carol Okafor");
  await joinFamily(carol, inviteCode);
  await addWishlistItem(carol, { title: "C1" });

  await alexa.goto("/wishlists");

  await expect(alexa.locator("main header")).not.toContainText(
    "Personne d’autre pour l’instant.",
  );

  const cards = alexa.locator('[data-test="browse-card"]');
  await expect(cards).toHaveText([/Bob Marley/, /Carol Okafor/]);

  const bobCard = cards.filter({ hasText: "Bob Marley" });
  await expect(bobCard.locator('[data-test="browse-summary"]')).toHaveText(
    "Pas encore d’envie",
  );
  await expect(bobCard.locator('[data-test="wishlist-open"]')).toHaveCount(0);
  await expect(bobCard.locator("a")).toHaveCount(0);

  const carolCard = cards.filter({ hasText: "Carol Okafor" });
  await expect(carolCard.locator('[data-test="browse-summary"]')).toHaveText("1 envie");
  await expect(carolCard.locator('[data-test="wishlist-open"]')).toHaveCount(1);
});
