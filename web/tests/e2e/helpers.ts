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
