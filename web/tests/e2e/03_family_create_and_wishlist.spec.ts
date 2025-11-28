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

    // Add wishlist item with all fields
    await addWishlistItem(page, {
        title: 'Nintendo Switch',
        url: 'https://example.com/switch',
        price: 299.99,
        priority: 1,
        notes: 'Prefer OLED model in red'
    });

    // Verify item via API and then UI
    const meResp = await page.request.get("/api/wishlists/me");
    const meData: any = await meResp.json();
    expect(meData.items.some((it: any) => it.title === "Nintendo Switch")).toBeTruthy();
    await page.reload();
    await expect(page.locator('text=Nintendo Switch')).toBeVisible({ timeout: 15000 });

    // Add another item with minimal fields (just title)
    await addWishlistItem(page, {
        title: 'Book: Clean Code'
    });

    // Verify second item appears
    await expect(page.locator('text=Book: Clean Code')).toBeVisible();

    // Delete the "Nintendo Switch" item specifically
    const switchItem = page.locator('li', { hasText: 'Nintendo Switch' });
    const deleteButton = switchItem.locator('button:has-text("Supprimer")');
    const deletion = page.waitForResponse((res) =>
        res.url().includes('/wishlists/me/items/') &&
        res.request().method() === 'DELETE' &&
        res.status() === 200
    );
    await deleteButton.click();
    await deletion;

    // Verify item was deleted (API can lag slightly, so poll briefly)
    let removed = false;
    for (let i = 0; i < 10; i++) {
        const afterDelete = await page.request.get("/api/wishlists/me");
        const afterData: any = await afterDelete.json();
        if (!afterData.items.some((it: any) => it.title === "Nintendo Switch")) {
            removed = true;
            break;
        }
        await page.waitForTimeout(500);
    }
    expect(removed).toBeTruthy();
    await expect(switchItem).toHaveCount(0, { timeout: 10000 });

    // Verify second item is still there
    await expect(page.locator('text=Book: Clean Code')).toBeVisible();
});
