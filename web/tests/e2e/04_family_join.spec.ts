import { expect, test } from "@playwright/test";
import {
  addWishlistItem,
  createFamily,
  joinFamily,
  registerUser,
} from "./helpers";

test("family join flow with multi-user interactions", async ({ browser }) => {
  // Create two independent browser contexts for two different users
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();

  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  // User A: Register and create family
  await registerUser(pageA);
  const familyData = await createFamily(pageA, "Smith Family");
  const inviteCode = familyData.inviteCode;

  // Verify invite code was generated
  expect(inviteCode).toBeTruthy();
  expect(inviteCode.length).toBeGreaterThan(5);

  // User A: Add wishlist items (need 3+ items to unlock family lists)
  await addWishlistItem(pageA, {
    title: "PlayStation 5",
    price: 499.99,
    priority: 1,
  });
  await addWishlistItem(pageA, { title: "Controller" });
  await addWishlistItem(pageA, { title: "Game: Spider-Man 2" });

  // User B: Register new account
  await registerUser(pageB);

  // User B: Should be redirected to /family/create
  await expect(pageB).toHaveURL(/\/family\/create/);

  // User B: Join the family using invite code
  await joinFamily(pageB, inviteCode);

  // User B: add their own items (needs >=3 items to browse others)
  await addWishlistItem(pageB, { title: "Chair" });
  await addWishlistItem(pageB, { title: "Desk" });
  await addWishlistItem(pageB, { title: "Lamp" });

  // User B: Navigate to /wishlists to see others
  await pageB.goto("/wishlists");
  await expect(pageB).toHaveURL(/\/wishlists/);

  // User B: Should see User A in the list (API then UI)
  await expect.poll(async () => {
    const othersResp = await pageB.request.get("/api/wishlists");
    const others: any[] = await othersResp.json();
    return others.length;
  }, { timeout: 20000 }).toBeGreaterThan(0);

  await pageB.waitForLoadState("networkidle");
  const othersLinks = pageB.locator('a:has-text("Ouvrir")');
  await expect(othersLinks.first()).toBeVisible({ timeout: 20000 });

  // User B: Click to view User A's wishlist
  await othersLinks.first().click();

  // User B: Should see User A's wishlist item
  await expect(pageB.locator("text=PlayStation 5")).toBeVisible({
    timeout: 15000,
  });
});
