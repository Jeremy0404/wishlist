import { test, expect } from "@playwright/test";
import { addWishlistItem, registerUser } from "./helpers";

const SLUG = /^elodie-martin-[a-z2-9]{4}$/;

async function readOwnWishlist(page: import("@playwright/test").Page) {
  const res = await page.request.get("/api/wishlists/me");
  expect(res.status()).toBe(200);
  return (await res.json()).wishlist;
}

test.describe("Share slug and visibility", () => {
  test("mints a readable slug that survives the visibility toggle", async ({
    page,
  }) => {
    await registerUser(page, "Élodie Martin");
    await addWishlistItem(page, { title: "Écharpe en laine" });

    const created = await readOwnWishlist(page);
    expect(created.public_slug).toMatch(SLUG);
    expect(created.published_at).toBeNull();

    const beforeSharing = await page.request.get(
      `/api/wishlists/public/${created.public_slug}`,
    );
    expect(beforeSharing.status()).toBe(404);

    const shared = await page.request.post("/api/wishlists/me/publish");
    expect(shared.status()).toBe(200);
    expect((await shared.json()).wishlist.public_slug).toBe(
      created.public_slug,
    );

    const publicView = await page.request.get(
      `/api/wishlists/public/${created.public_slug}`,
    );
    expect(publicView.status()).toBe(200);
    const body = await publicView.json();
    expect(body.owner.name).toBe("Élodie Martin");
    expect(body.items.map((i: { title: string }) => i.title)).toEqual([
      "Écharpe en laine",
    ]);
    expect(Object.keys(body.items[0])).not.toContain("reserved");

    const unshared = await page.request.delete("/api/wishlists/me/publish");
    expect(unshared.status()).toBe(200);
    const afterUnsharing = await unshared.json();
    expect(afterUnsharing.wishlist.public_slug).toBe(created.public_slug);
    expect(afterUnsharing.wishlist.published_at).toBeNull();

    const goneAgain = await page.request.get(
      `/api/wishlists/public/${created.public_slug}`,
    );
    expect(goneAgain.status()).toBe(404);

    const reshared = await page.request.post("/api/wishlists/me/publish");
    expect(reshared.status()).toBe(200);
    expect((await reshared.json()).wishlist.public_slug).toBe(
      created.public_slug,
    );
    const resolvesAgain = await page.request.get(
      `/api/wishlists/public/${created.public_slug}`,
    );
    expect(resolvesAgain.status()).toBe(200);
  });

  test("gives each owner their own slug", async ({ page, browser }) => {
    await registerUser(page, "Élodie Martin");
    await addWishlistItem(page, { title: "Écharpe en laine" });
    const mine = await readOwnWishlist(page);

    const other = await browser.newPage();
    await registerUser(other, "Élodie Martin");
    await addWishlistItem(other, { title: "Bougies" });
    const theirs = await readOwnWishlist(other);
    await other.close();

    expect(theirs.public_slug).toMatch(SLUG);
    expect(theirs.public_slug).not.toBe(mine.public_slug);
  });
});
