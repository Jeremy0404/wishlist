// Shared test helpers for Playwright E2E tests
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/** Generate a unique email address for each test run */
export function uniqueEmail(): string {
    const timestamp = Date.now();
    return `user${timestamp}@example.com`;
}

/** Register a new user and return its credentials */
export async function registerUser(page: Page): Promise<{ email: string; password: string }> {
    const email = uniqueEmail();
    const password = 'password123';
    await page.goto('/auth/register');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="new-password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/me/);
    return { email, password };
}

/** Log in with the supplied credentials */
export async function loginUser(page: Page, email: string, password: string): Promise<void> {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/me/);
}
