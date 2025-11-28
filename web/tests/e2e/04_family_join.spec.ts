import { test, expect } from '@playwright/test';
import { registerUser, createFamily, joinFamily, addWishlistItem } from './helpers';

test('family join flow with multi-user interactions', async ({ browser }) => {
    // Create two independent browser contexts for two different users
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
        // User A: Register and create family
        await registerUser(pageA);
        const familyData = await createFamily(pageA, 'Smith Family');
        const inviteCode = familyData.inviteCode;

        // Verify invite code was generated
        expect(inviteCode).toBeTruthy();
        expect(inviteCode.length).toBeGreaterThan(5);

        // User A: Add a wishlist item
        await addWishlistItem(pageA, {
            title: 'PlayStation 5',
            price: 499.99,
            priority: 1
        });

        // User B: Register new account
        await registerUser(pageB);

        // User B: Should be redirected to /family/create
        await expect(pageB).toHaveURL(/\/family\/create/);

        // User B: Join the family using invite code
        await joinFamily(pageB, inviteCode);

        // User B: Navigate to /me
        await pageB.goto('/me');
        await expect(pageB).toHaveURL(/\/me/);

        // User B: Should have empty wishlist (their own initially)

        // User B: Navigate to /wishlists to see others
        await pageB.goto('/wishlists');
        await expect(pageB).toHaveURL(/\/wishlists/);

        // User B: Should see User A in the list
        const othersLinks = pageB.locator('a:has-text("Voir")');
        await expect(othersLinks.first()).toBeVisible();

        // User B: Click to view User A's wishlist
        await othersLinks.first().click();

        // User B: Should see User A's wishlist item
        await expect(pageB.locator('text=PlayStation 5')).toBeVisible();
        await expect(pageB.locator('text=499,99 €')).toBeVisible();

    } finally {
        // Clean up contexts
        await contextA.close();
        await contextB.close();
    }
});
