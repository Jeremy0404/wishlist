// Shared test helpers for Playwright E2E tests
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/** Generate a unique email address for each test run */
export function uniqueEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `user${timestamp}-${random}@example.com`;
}

/** Register a new user and return its credentials */
export async function registerUser(
  page: Page,
): Promise<{ email: string; password: string }> {
  const email = uniqueEmail();
  const password = "password123";
  await page.goto("/auth/register");
  await page.fill('input[name="name"]', "Test User");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="new-password"]', password);
  await page.click('button[type="submit"]');

  // Wait for navigation to either /me or /family/create (if new user needs to create family)
  await expect(page).toHaveURL(/\/me|\/family\/create/);

  return { email, password };
}

/** Sign out via the navbar control */
export async function logout(page: Page): Promise<void> {
  await page.click('button[data-test="logout"]');
  await expect(page).toHaveURL(/^https?:\/\/[^\/]+\/$/);
}

/** Add a wishlist item through the UI form */
export async function addWishlistItemViaForm(
  page: Page,
  item: {
    title: string;
    url?: string;
    price?: number | string;
    notes?: string;
    priority?: number | string;
  },
): Promise<void> {
  await page.goto("/me");
  await expect(page.locator('[data-test="wishlist-add-submit"]')).toBeVisible();

  await page.fill('[data-test="item-title"]', item.title);
  if (item.url) await page.fill('[data-test="item-url"]', item.url);
  if (item.price !== undefined)
    await page.fill('[data-test="item-price"]', String(item.price));
  if (item.priority !== undefined)
    await page.fill('[data-test="item-priority"]', String(item.priority));
  if (item.notes) await page.fill('[data-test="item-notes"]', item.notes);

  const createResponse = page.waitForResponse(
    (res) =>
      res.url().includes("/api/wishlists/me/items") &&
      res.request().method() === "POST" &&
      res.status() === 201,
  );
  await page.click('[data-test="wishlist-add-submit"]');
  await createResponse;

  await expect(
    page.locator('[data-test="wishlist-item"]').filter({ hasText: item.title }),
  ).toBeVisible({ timeout: 15000 });
}

/** Edit a wishlist item inline using the UI */
export async function editWishlistItem(
  page: Page,
  currentTitle: string,
  updates: {
    title: string;
    url?: string;
    price?: number | string;
    notes?: string;
    priority?: number | string;
  },
): Promise<void> {
  const item = page.locator(
    `[data-test="wishlist-item"][data-title="${currentTitle}"]`,
  );
  const fallback = page
    .locator('[data-test="wishlist-item"]')
    .filter({ hasText: currentTitle });

  const target = (await item.count()) > 0 ? item : fallback;
  await expect(target).toBeVisible();

  await target.locator('[data-test="wishlist-edit"]').click();
  await expect(target.locator('input[name="title"]')).toBeVisible();

  await target.locator('input[name="title"]').fill(updates.title);
  if (updates.url !== undefined)
    await target.locator('input[name="url"]').fill(updates.url);
  if (updates.price !== undefined)
    await target
      .locator('input[name="price_eur"]')
      .fill(String(updates.price));
  if (updates.priority !== undefined)
    await target
      .locator('input[name="priority"]')
      .fill(String(updates.priority));
  if (updates.notes !== undefined)
    await target.locator('textarea[name="notes"]').fill(updates.notes);

  const saveResponse = page.waitForResponse(
    (res) =>
      res.url().includes("/api/wishlists/me/items/") &&
      res.request().method() === "PATCH" &&
      res.status() === 200,
  );
  await target.locator('[data-test="wishlist-edit-save"]').click();
  await saveResponse;

  await expect(target.locator("text=" + updates.title)).toBeVisible({
    timeout: 10000,
  });
}

/** Delete a wishlist item via UI and wait for it to disappear */
export async function deleteWishlistItem(
  page: Page,
  title: string,
): Promise<void> {
  const item = page
    .locator('[data-test="wishlist-item"]')
    .filter({ hasText: title });
  await expect(item).toBeVisible();

  const deleteResponse = page.waitForResponse(
    (res) =>
      res.url().includes("/api/wishlists/me/items/") &&
      res.request().method() === "DELETE" &&
      res.status() === 200,
  );
  await item.locator('[data-test="wishlist-delete"]').click();
  await deleteResponse;

  await expect(item).toHaveCount(0, { timeout: 10000 });
}

/** Log in with the supplied credentials */
export async function loginUser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/auth/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/me/);
}

/** Create a family and return the family data including invite code */
export async function createFamily(
  page: Page,
  familyName: string = "Test Family",
): Promise<{ name: string; inviteCode: string }> {
  // Navigate if not already there
  if (!page.url().includes("/family/create")) {
    await page.goto("/family/create");
  }

  // Wait for input to be visible - using class selector for robustness
  const nameInput = page.locator("input.test-family-name-input");
  await expect(nameInput).toBeVisible({ timeout: 5000 });

  await nameInput.fill(familyName);
  await page.click('[data-test="family-create-submit"]');

  // Wait for family creation success
  await page.waitForSelector("code", { timeout: 5000 });
  const inviteCodeElement = page.locator("code").first();
  const inviteCode = (await inviteCodeElement.textContent()) || "";

  return { name: familyName, inviteCode };
}

/** Join a family using an invite code */
export async function joinFamily(
  page: Page,
  inviteCode: string,
): Promise<void> {
  await page.goto("/family/join");
  await page.fill('input[data-test="family-code-input"]', inviteCode);
  await page.click('[data-test="family-join-submit"]');

  // Wait for success message
  await page.waitForSelector(".text-green-700", { timeout: 5000 });

  // Wait for auth refresh to complete (the component calls auth.refreshFamilies())
  await page.waitForLoadState("networkidle");

  // Small additional wait to ensure state is fully updated
  await page.waitForTimeout(500);
}

/** Add a wishlist item with all or minimal fields */
export async function addWishlistItem(
  page: Page,
  item: {
    title: string;
    url?: string;
    price?: number;
    notes?: string;
    priority?: number;
  },
): Promise<any> {
  const payload: any = {
    title: item.title,
    url: item.url,
    price_eur: item.price,
    notes: item.notes,
    priority: item.priority,
  };

  const createRes = await page.request.post("/api/wishlists/me/items", {
    data: payload,
  });
  expect(createRes.status()).toBe(201);

  const created = await createRes.json();

  await page.goto("/me");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("text=" + item.title).first()).toBeVisible({
    timeout: 20000,
  });

  return created;
}
