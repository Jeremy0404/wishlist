import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  addWishlistItem,
  createFamily,
  joinFamily,
  openAddSheet,
  registerUser,
} from "./helpers";

const PHONE_MAX_WIDTH = 500;

async function userId(page: Page): Promise<string> {
  return (await (await page.request.get("/api/auth/me")).json()).id;
}

/** A viewer whose own list is long enough to open someone else's. */
async function familyWithOwnerAndViewer(browser: Browser, familyName: string) {
  const owner = await (await browser.newContext()).newPage();
  const viewer = await (await browser.newContext()).newPage();

  await registerUser(owner, "Nora Petit");
  const { inviteCode } = await createFamily(owner, familyName);
  const gift = await addWishlistItem(owner, { title: "Gourde isotherme" });

  await registerUser(viewer, "Hugo Petit");
  await joinFamily(viewer, inviteCode);
  for (const title of ["Casque audio", "Carnet", "Plaid"]) {
    await addWishlistItem(viewer, { title });
  }

  return { owner, viewer, gift, ownerId: await userId(owner) };
}

function bottomTab(page: Page, name: string) {
  return page.locator(`[data-test="${name}"]:visible`);
}

test("the own list renders at phone width and a wish is added from the sheet", async ({
  page,
}) => {
  await registerUser(page);
  expect(page.viewportSize()!.width).toBeLessThan(PHONE_MAX_WIDTH);

  await expect(page.locator('[data-test="empty-state"]')).toBeVisible();
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflows, "horizontal scrolling on the own list").toBe(false);

  await openAddSheet(page);
  const submit = page.locator('[data-test="wishlist-add-submit"]');
  await expect(submit).toBeInViewport();

  await page.fill('[data-test="quick-add-entry"]', "Lampe de chevet");
  await submit.tap();

  await expect(page.locator('[data-test="sheet"]')).toHaveCount(0);
  await expect(
    page.locator('[data-test="wishlist-item"]').filter({ hasText: "Lampe de chevet" }),
  ).toBeVisible();
});

test("someone else's list offers Je l’offre and reserving works at phone width", async ({
  browser,
}) => {
  const { viewer, gift, ownerId } = await familyWithOwnerAndViewer(
    browser,
    "Phone Reserve Family",
  );

  await viewer.goto(`/wishlists/${ownerId}`);
  const card = viewer.locator(`[data-test="wishlist-item"][data-id="${gift.id}"]`);
  const reserve = card.locator('[data-test="wishlist-reserve"]');

  await expect(reserve).toHaveText("Je l’offre");
  await reserve.tap();
  await expect(card.locator('[data-test="wishlist-status"]')).toHaveText("Tu l’offres");
});

test("the bottom navigation moves between the own list and the family", async ({
  browser,
}) => {
  const { viewer, ownerId } = await familyWithOwnerAndViewer(
    browser,
    "Phone Nav Family",
  );

  const myList = bottomTab(viewer, "tab-my-list");
  const family = bottomTab(viewer, "tab-family");

  const viewportHeight = viewer.viewportSize()!.height;
  const navBox = await family.boundingBox();
  expect(navBox!.y + navBox!.height).toBeGreaterThan(viewportHeight - 1);

  await expect(myList).toHaveAttribute("aria-current", "page");

  await family.tap();
  await expect(viewer).toHaveURL(/\/wishlists$/);
  await expect(family).toHaveAttribute("aria-current", "page");
  await expect(myList).not.toHaveAttribute("aria-current", "page");

  await viewer
    .locator('[data-test="browse-card"]')
    .filter({ hasText: "Nora Petit" })
    .locator('[data-test="wishlist-open"]')
    .tap();
  await expect(viewer).toHaveURL(new RegExp(`/wishlists/${ownerId}$`));
  await expect(family).toHaveAttribute("aria-current", "page");

  await myList.tap();
  await expect(viewer).toHaveURL(/\/me$/);
  await expect(myList).toHaveAttribute("aria-current", "page");
});
