import { expect, test, type Browser, type Page } from "@playwright/test";
import { addWishlistItem, createFamily, joinFamily, registerUser } from "./helpers";

const PROXY_ERROR = {
  status: 502,
  contentType: "text/html",
  body: "<html><body><h1>502 Bad Gateway</h1></body></html>",
};

async function failGets(page: Page, url: string) {
  await page.route(url, (route) =>
    route.request().method() === "GET" ? route.fulfill(PROXY_ERROR) : route.continue(),
  );
}

test("a failed load of the own list offers a retry instead of an empty list", async ({
  page,
}) => {
  await registerUser(page);
  await addWishlistItem(page, { title: "Plaid en laine" });

  await failGets(page, "**/api/wishlists/me");
  await page.goto("/me");

  await expect(page.locator('[data-test="load-error"]')).toContainText(
    "Impossible de charger pour l’instant",
  );
  await expect(page.locator('[data-test="empty-state"]')).toHaveCount(0);

  await page.unroute("**/api/wishlists/me");
  await page.click('[data-test="load-retry"]');
  await expect(page.locator('[data-test="wishlist-item"]')).toContainText("Plaid en laine");
});

test("a failed family load never reads as having no family", async ({ page }) => {
  await registerUser(page);
  await createFamily(page, "Outage Family");

  await failGets(page, "**/api/families/me");
  await page.goto("/wishlists");

  await expect(page.locator('[data-test="load-error"]')).toBeVisible();
  await expect(page.locator("main header")).not.toContainText("Personne d’autre");
  await expect(page.locator('[data-test="browse-invite"]')).toHaveCount(0);

  await page.unroute("**/api/families/me");
  await page.click('[data-test="load-retry"]');
  await expect(page.locator("main header")).toContainText("Outage Family");
  await expect(page.locator('[data-test="browse-invite"]')).toBeVisible();
});

test("a failed family listing shows no raw server message", async ({ page }) => {
  await registerUser(page);
  await createFamily(page, "Listing Family");

  await failGets(page, "**/api/wishlists");
  await page.goto("/wishlists");

  await expect(page.locator('[data-test="load-error"]')).toBeVisible();
  await expect(page.locator("main")).not.toContainText("Bad Gateway");
});

async function viewerOfOneWish(browser: Browser) {
  const owner = await (await browser.newContext()).newPage();
  const viewer = await (await browser.newContext()).newPage();

  await registerUser(owner);
  const { inviteCode } = await createFamily(owner, "Viewing Family");
  const wish = await addWishlistItem(owner, { title: "Moulin à poivre" });
  const ownerId = (await (await owner.request.get("/api/auth/me")).json()).id;

  await registerUser(viewer);
  await joinFamily(viewer, inviteCode);
  return { viewer, ownerId, wish };
}

test("a failed load of someone's list offers a retry", async ({ browser }) => {
  const { viewer, ownerId } = await viewerOfOneWish(browser);
  const listUrl = `**/api/wishlists/${ownerId}`;

  await failGets(viewer, listUrl);
  await viewer.goto(`/wishlists/${ownerId}`);
  await expect(viewer.locator('[data-test="load-error"]')).toBeVisible();
  await expect(viewer.locator("main")).not.toContainText("Bad Gateway");

  await viewer.unroute(listUrl);
  await viewer.click('[data-test="load-retry"]');
  await expect(viewer.locator('[data-test="wishlist-item"]')).toContainText("Moulin à poivre");
});

test("a failed refresh keeps someone's list on screen", async ({ browser }) => {
  const { viewer, ownerId, wish } = await viewerOfOneWish(browser);

  await viewer.goto(`/wishlists/${ownerId}`);
  const card = viewer.locator(`[data-test="wishlist-item"][data-id="${wish.id}"]`);
  await expect(card).toBeVisible();

  await failGets(viewer, `**/api/wishlists/${ownerId}`);
  await card.locator('[data-test="wishlist-reserve"]').click();

  await expect(viewer.locator('[data-test="toast"][data-kind="error"]')).toBeVisible();
  await expect(card).toContainText("Moulin à poivre");
  await expect(viewer.locator('[data-test="load-error"]')).toHaveCount(0);
});
