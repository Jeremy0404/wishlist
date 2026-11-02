import { defineConfig, devices } from '@playwright/test';

/** These change a setting every user shares, so they run once the rest is done. */
const APP_WIDE_SETTING_SPECS = /\.global\.spec\.ts$/;

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: process.env.BASE_URL || 'http://web',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
            testIgnore: APP_WIDE_SETTING_SPECS,
        },
        {
            name: 'app-wide settings',
            use: { ...devices['Desktop Chrome'] },
            testMatch: APP_WIDE_SETTING_SPECS,
            dependencies: ['chromium'],
        },
    ],
});
