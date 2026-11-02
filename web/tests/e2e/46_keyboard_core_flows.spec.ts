import { expect, test, type Locator, type Page } from "@playwright/test";
import { addWishlistItem, createFamily, joinFamily, registerUser } from "./helpers";

const MAX_TAB_PRESSES = 30;

async function isFocused(target: Locator): Promise<boolean> {
  return target.evaluate((el) => el === document.activeElement);
}

/** Press Tab the way a keyboard user would until the target has focus. */
async function tabTo(page: Page, target: Locator): Promise<void> {
  await expect(target).toBeVisible();
  for (let presses = 0; presses < MAX_TAB_PRESSES; presses++) {
    await page.keyboard.press("Tab");
    if (await isFocused(target)) return;
  }
  throw new Error(`not reachable within ${MAX_TAB_PRESSES} Tab presses`);
}

test("a wish is added with the keyboard alone", async ({ page }) => {
  await registerUser(page);
  await page.goto("/me");

  const addOpen = page.locator('[data-test="wishlist-add-open"]');
  await tabTo(page, addOpen);
  await page.keyboard.press("Enter");

  const entry = page.locator('[data-test="quick-add-entry"]');
  await expect(entry).toBeFocused();
  await page.keyboard.type("Moulin à poivre");
  await page.keyboard.press("Enter");

  await expect(page.locator('[data-test="sheet"]')).toHaveCount(0);
  await expect(
    page.locator('[data-test="wishlist-item"]').filter({ hasText: "Moulin à poivre" }),
  ).toBeVisible();
});

test("a gift is reserved on someone's list with the keyboard alone", async ({
  browser,
}) => {
  const owner = await (await browser.newContext()).newPage();
  const viewer = await (await browser.newContext()).newPage();

  await registerUser(owner, "Iris Lemoine");
  const { inviteCode } = await createFamily(owner, "Keyboard Family");
  await addWishlistItem(owner, { title: "Tasse en grès" });
  const gift = await addWishlistItem(owner, { title: "Écharpe en laine" });

  await registerUser(viewer);
  await joinFamily(viewer, inviteCode);
  for (const title of ["Puzzle", "Bougie", "Agenda"]) {
    await addWishlistItem(viewer, { title });
  }

  const ownerId = (await (await owner.request.get("/api/auth/me")).json()).id;
  await viewer.goto(`/wishlists/${ownerId}`);

  const card = viewer.locator(`[data-test="wishlist-item"][data-id="${gift.id}"]`);
  const reserve = card.locator('[data-test="wishlist-reserve"]');
  await expect(reserve).toHaveText("Je l’offre");

  await tabTo(viewer, reserve);
  await viewer.keyboard.press("Enter");

  await expect(card.locator('[data-test="wishlist-status"]')).toHaveText("Tu l’offres");
});
