import { test, expect } from '@playwright/test';
import { registerUser, createFamily } from './helpers';

test.describe('Route Guards', () => {
    test('guest visiting protected route redirects to login', async ({ page }) => {
        // Guest tries to visit /me
        await page.goto('/me');

        // Should be redirected to login with redirect query parameter
        await expect(page).toHaveURL(/\/auth\/login/);
        await expect(page.url()).toContain('redirect');
    });

    test('logged-in user visiting guest-only route redirects to /me', async ({ page }) => {
        // Register and log in
        await registerUser(page);
        await createFamily(page);

        // Try to visit login page while logged in
        await page.goto('/auth/login');

        // Should be redirected to /me
        await expect(page).toHaveURL(/\/me/);
    });

    test('logged-in user visiting register page redirects to /me', async ({ page }) => {
        // Register and log in
        await registerUser(page);
        await createFamily(page);

        // Try to visit register page while logged in
        await page.goto('/auth/register');

        // Should be redirected to /me
        await expect(page).toHaveURL(/\/me/);
    });

    test('user without family visiting /me redirects to /family/create', async ({ page }) => {
        // Register but don't create family
        await registerUser(page);

        // Try to visit /me without having a family
        await page.goto('/me');

        // Should be redirected to family create with redirect query
        await expect(page).toHaveURL(/\/family\/create/);
        await expect(page.url()).toContain('redirect');
    });

    test('user with family visiting /family/join redirects to /me', async ({ page }) => {
        // Register and create family
        await registerUser(page);
        await createFamily(page);

        // Try to visit /family/join when already in a family
        await page.goto('/family/join');

        // Should be redirected to /me
        await expect(page).toHaveURL(/\/me/);
    });

    test('user can access /wishlists only when in a family', async ({ page }) => {
        // Register but don't create family
        await registerUser(page);

        // Try to visit /wishlists without family
        await page.goto('/wishlists');

        // Should be redirected to family create
        await expect(page).toHaveURL(/\/family\/create/);

        // Now create a family
        await createFamily(page);

        // Try again to visit /wishlists
        await page.goto('/wishlists');

        // Should now be allowed
        await expect(page).toHaveURL(/\/wishlists/);
    });
});
