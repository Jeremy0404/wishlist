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
  name = "Test User",
): Promise<{ email: string; password: string }> {
  const email = uniqueEmail();
  const password = "password123";
  await page.goto("/");
  await usePasswordForm(page);
  await page.click('button[data-test="want-register"]');
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="new-password"]', password);
  await page.click('button[type="submit"]');

  // A new user lands straight on their own list: family membership is optional
  await expect(page).toHaveURL(/\/me/);

  return { email, password };
}

/** Open the account sheet behind the avatar, whichever one is on screen */
export async function openAccount(page: Page): Promise<void> {
  await page.locator('[data-test="account-open"]:visible').first().click();
  await expect(page.locator('[data-test="sheet"]')).toBeVisible();
}

/** Sign out from the account sheet */
export async function logout(page: Page): Promise<void> {
  await openAccount(page);
  await page.click('button[data-test="logout"]');
  await expect(page).toHaveURL(/^https?:\/\/[^/]+\/$/);
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
  await openAddSheet(page);

  await page.fill('[data-test="quick-add-entry"]', item.title);
  if (Number(item.priority) === 1) await page.click('[data-test="item-favorite"]');

  const hasDetails =
    item.url !== undefined || item.price !== undefined || item.notes !== undefined;

  if (hasDetails) {
    await page.click('[data-test="quick-add-toggle"]');
    await expect(page.locator('[data-test="quick-add-details"]')).toBeVisible();

    if (item.url) await page.fill('[data-test="item-url"]', item.url);
    if (item.price !== undefined)
      await page.fill('[data-test="item-price"]', String(item.price));
    if (item.notes) await page.fill('[data-test="item-notes"]', item.notes);
  }

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

/** Open a wish in its sheet, edit it and wait for the save */
export async function editWishlistItem(
  page: Page,
  currentTitle: string,
  updates: {
    title: string;
    url?: string;
    price?: number | string;
    notes?: string;
    favorite?: boolean;
  },
): Promise<void> {
  const item = page.locator(
    `[data-test="wishlist-item"][data-title="${currentTitle}"]`,
  );
  await item.locator('[data-test="wishlist-edit"]').click();
  const sheet = page.locator('[data-test="sheet"]');

  await sheet.locator('input[name="title"]').fill(updates.title);
  if (updates.url !== undefined)
    await sheet.locator('input[name="url"]').fill(updates.url);
  if (updates.price !== undefined)
    await sheet.locator('input[name="price_eur"]').fill(String(updates.price));
  if (updates.notes !== undefined)
    await sheet.locator('textarea[name="notes"]').fill(updates.notes);
  if (updates.favorite !== undefined) {
    const toggle = sheet.locator('[data-test="item-favorite"]');
    if ((await toggle.getAttribute("aria-pressed")) !== String(updates.favorite))
      await toggle.click();
  }

  const saveResponse = page.waitForResponse(
    (res) =>
      res.url().includes("/api/wishlists/me/items/") &&
      res.request().method() === "PATCH" &&
      res.status() === 200,
  );
  await sheet.locator('[data-test="wishlist-edit-save"]').click();
  await saveResponse;
  await expect(item).toContainText(updates.title);
}

/** Remove a wish through its sheet and wait for it to disappear */
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
  await item.locator('[data-test="wishlist-edit"]').click();
  const sheet = page.locator('[data-test="sheet"]');
  await sheet.locator('[data-test="wishlist-delete"]').click();
  await sheet.locator('[data-test="inline-confirm-accept"]').click();
  await deleteResponse;

  await expect(item).toHaveCount(0, { timeout: 10000 });
}

/** Open the "Ajouter une envie" sheet on the own list */
export async function openAddSheet(page: Page): Promise<void> {
  await page.click('[data-test="wishlist-add-open"]');
  await expect(page.locator('[data-test="quick-add-entry"]')).toBeVisible();
}

/** Passwords are the fallback branch of the sign-in card: the magic-link form
 *  is what the merged screen opens on. */
export async function usePasswordForm(page: Page): Promise<void> {
  await page.click('button[data-test="use-password"]');
}

/** Log in with the supplied credentials */
export async function loginUser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/");
  await usePasswordForm(page);
  await page.fill('input[name="identifier"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/me/);
}

export const ADMIN = {
  name: "Admin Test",
  email: "admin@site.test",
  password: "password123",
};

/** The admin address is fixed by the test stack's ADMIN_EMAILS, so the
 *  account outlives a run: register it once, sign back in afterwards. */
export async function signInAsAdmin(page: Page): Promise<void> {
  const registered = await page.request.post("/api/auth/register", {
    data: ADMIN,
  });
  if (registered.status() === 409) {
    const loggedIn = await page.request.post("/api/auth/login", {
      data: { identifier: ADMIN.email, password: ADMIN.password },
    });
    expect(loggedIn.ok()).toBeTruthy();
  } else {
    expect(registered.ok()).toBeTruthy();
  }
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
  await page.waitForSelector('[data-test="family-join-success"]', {
    timeout: 5000,
  });

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
