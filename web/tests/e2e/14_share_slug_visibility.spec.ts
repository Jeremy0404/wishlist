import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { addWishlistItem, registerUser } from "./helpers";

const SLUG = /^elodie-martin-[a-z2-9]{4}$/;

async function readOwnWishlist(page: Page) {
  const res = await page.request.get("/api/wishlists/me");
  expect(res.status()).toBe(200);
  return (await res.json()).wishlist;
}

async function setVisibility(page: Page, value: "shared" | "private") {
  const response = page.waitForResponse(
    (res) => res.url().includes("/api/wishlists/me/publish") && res.ok(),
  );
  await page.click(`[data-test="share-visibility-${value}"]`);
  await response;
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

    // Private: the link is shown, greyed and inert, with a line saying so
    await expect(page.locator('[data-test="share-link"]')).toHaveValue(
      new RegExp(`/share/${created.public_slug}$`),
    );
    await expect(page.locator('[data-test="share-private-hint"]')).toBeVisible();
    await expect(page.locator('[data-test="share-copy"]')).toBeDisabled();

    const beforeSharing = await page.request.get(
      `/api/wishlists/public/${created.public_slug}`,
    );
    expect(beforeSharing.status()).toBe(404);

    // Turning sharing on asks nothing: an unhandled confirm would be dismissed
    await setVisibility(page, "shared");
    await expect(
      page.locator('[data-test="share-private-hint"]'),
    ).toHaveCount(0);
    expect((await readOwnWishlist(page)).public_slug).toBe(created.public_slug);

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

    // Copy gives visible feedback on the button itself. The clipboard API needs
    // a secure context, which the plain-http test stack is not, so it is stubbed.
    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: async () => {} },
      });
    });
    await page.click('[data-test="share-copy"]');
    await expect(page.locator('[data-test="share-copy"]')).toHaveText("Copié !");

    // Turning it off asks for confirmation, and declining changes nothing
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.click('[data-test="share-visibility-private"]');
    await expect(
      page.locator('[data-test="share-private-hint"]'),
    ).toHaveCount(0);
    expect(
      (await page.request.get(`/api/wishlists/public/${created.public_slug}`))
        .status(),
    ).toBe(200);

    page.once("dialog", (dialog) => dialog.accept());
    await setVisibility(page, "private");
    await expect(page.locator('[data-test="share-private-hint"]')).toBeVisible();

    const unshared = await readOwnWishlist(page);
    expect(unshared.public_slug).toBe(created.public_slug);
    expect(unshared.published_at).toBeNull();

    const goneAgain = await page.request.get(
      `/api/wishlists/public/${created.public_slug}`,
    );
    expect(goneAgain.status()).toBe(404);

    await setVisibility(page, "shared");
    expect((await readOwnWishlist(page)).public_slug).toBe(created.public_slug);
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
