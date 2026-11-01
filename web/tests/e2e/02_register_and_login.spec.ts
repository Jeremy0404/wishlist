import { test, expect } from '@playwright/test';
import { registerUser, loginUser, logout } from './helpers';

test('register a new user and login', async ({ page }) => {
    const { email, password } = await registerUser(page);
    // Logout to test login flow
    await logout(page);
    await expect(page).toHaveURL(/^https?:\/\/[^/]+\/$/);  // Should redirect to home page after logout
    await loginUser(page, email, password);
});
