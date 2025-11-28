import { test, expect } from '@playwright/test';
import { registerUser, createFamily, addWishlistItem } from './helpers';

test('complete family creation and wishlist management flow', async ({ page }) => {
    // Register new user
    await registerUser(page);

    // User should be redirected to /family/create (since they have no family)
    await expect(page).toHaveURL(/\/family\/create/);

    // Create a family
    const familyData = await createFamily(page, 'Test Family');

    // Verify invite code is displayed
    expect(familyData.inviteCode).toBeTruthy();
    expect(familyData.inviteCode.length).toBeGreaterThan(0);

    // Navigate to /me (wishlist page)
    await page.goto('/me');
    await expect(page).toHaveURL(/\/me/);

    // Verify we're on the wishlist page (empty initially)

    // Add wishlist item with all fields
    await addWishlistItem(page, {
        title: 'Nintendo Switch',
        url: 'https://example.com/switch',
        price: 299.99,
        priority: 1,
        notes: 'Prefer OLED model in red'
    });

    // Verify item appears in list
    await expect(page.locator('text=Nintendo Switch')).toBeVisible();
    await expect(page.locator('text=299,99 €')).toBeVisible();
    await expect(page.locator('text=• P1')).toBeVisible();
    await expect(page.locator('text=Prefer OLED model in red')).toBeVisible();

    // Add another item with minimal fields (just title)
    await addWishlistItem(page, {
        title: 'Book: Clean Code'
    });

    // Verify second item appears
    await expect(page.locator('text=Book: Clean Code')).toBeVisible();

    // Delete the first item
    const deleteButtons = page.locator('button:has-text("Supprimer")');
    await deleteButtons.first().click();

    // Verify item was deleted
    await expect(page.locator('text=Nintendo Switch')).not.toBeVisible();

    // Verify second item is still there
    await expect(page.locator('text=Book: Clean Code')).toBeVisible();
});
