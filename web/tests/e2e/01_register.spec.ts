import { test, expect } from '@playwright/test';
import { registerUser } from './helpers';

test('should register a new user', async ({ page }) => {
    await registerUser(page);
    await expect(page.locator('h1')).toContainText('Créer une famille');
});
