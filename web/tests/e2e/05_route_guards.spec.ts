import { test, expect } from '@playwright/test';
import { addWishlistItemViaForm, registerUser, createFamily } from './helpers';

test.describe('Route Guards', () => {
    test('guest visiting protected route redirects to the sign-in screen', async ({ page }) => {
        // Guest tries to visit /me
        await page.goto('/me');

        // Should be redirected to the merged screen with a redirect query parameter
        await expect(page).toHaveURL(/\/\?redirect=/);
        await expect(page.url()).toContain('redirect');
    });

    test('logged-in user visiting guest-only route redirects to /me', async ({ page }) => {
        // Register and log in
        await registerUser(page);
        await createFamily(page);

        // The old login path redirects onto the merged screen, which is guest-only
        await page.goto('/auth/login');

        // Should be redirected to /me
        await expect(page).toHaveURL(/\/me/);
    });

    test('logged-in user visiting register page redirects to /me', async ({ page }) => {
        // Register and log in
        await registerUser(page);
        await createFamily(page);

        // Same for the old register path
        await page.goto('/auth/register');

        // Should be redirected to /me
        await expect(page).toHaveURL(/\/me/);
    });

    test('user without family owns a list and is never sent to a family screen', async ({ page }) => {
        // Register but don't create family
        await registerUser(page);

        // /me is theirs straight away, and usable
        await page.goto('/me');
        await expect(page).toHaveURL(/\/me/);

        await addWishlistItemViaForm(page, { title: 'Une chose que je veux' });
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

    test('user without family reaches /wishlists and is nudged rather than blocked', async ({ page }) => {
        // Register but don't create family
        await registerUser(page);

        // /wishlists no longer redirects; it explains why there is nothing there
        await page.goto('/wishlists');
        await expect(page).toHaveURL(/\/wishlists/);
        await expect(page.locator('[data-test="browse-card"]')).toHaveCount(0);
        await expect(page.getByText('Rejoins une famille')).toBeVisible();

        // Joining is offered from the navigation instead of being forced
        await page.getByRole('link', { name: 'Rejoindre une famille' }).click();
        await expect(page).toHaveURL(/\/family\/join/);
    });
});
