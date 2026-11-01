import { expect, test, type Page } from "@playwright/test";

const INVITE_PATH = "/family/join?code=FAM-ABC123";

async function stubMagicLinkSession(page: Page, created: boolean) {
  const user = { id: "guest-1", email: "guest@site.test", name: "Guest" };

  await page.route("**/api/auth/magic-link/consume", (route) =>
    route.fulfill({ json: { ...user, created } }),
  );
  await page.route("**/api/families/me", (route) => route.fulfill({ json: null }));
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ json: { ...user, name: "Guest Renamed" } }),
  );
}

test("asking for a link from an invite sends the invite along", async ({ page }) => {
  await page.goto(INVITE_PATH);
  await expect(page).toHaveURL(/\/\?redirect=/);

  await page.route("**/api/auth/magic-link", (route) =>
    route.fulfill({ json: { ok: true } }),
  );
  const requested = page.waitForRequest("**/api/auth/magic-link");
  await page.fill('[data-test="magic-email"]', "guest@site.test");
  await page.click('[data-test="magic-send"]');

  expect((await requested).postDataJSON()).toEqual({
    email: "guest@site.test",
    redirect: INVITE_PATH,
  });
});

test("an existing account signing in from an invite lands on the invite", async ({
  page,
}) => {
  await stubMagicLinkSession(page, false);

  await page.goto(
    `/auth/magic?token=t&redirect=${encodeURIComponent(INVITE_PATH)}`,
  );

  await expect(page).toHaveURL(INVITE_PATH);
  await expect(page.locator('input[name="code"]')).toHaveValue("FAM-ABC123");
});

test("a new account from an invite names itself, then lands on the invite", async ({
  page,
}) => {
  await stubMagicLinkSession(page, true);

  await page.goto(
    `/auth/magic?token=t&redirect=${encodeURIComponent(INVITE_PATH)}`,
  );

  await expect(page.locator('[data-test="welcome-name"]')).toBeVisible();
  await page.fill('[data-test="welcome-name-input"]', "Guest Renamed");
  await page.click('[data-test="welcome-name-submit"]');

  await expect(page).toHaveURL(INVITE_PATH);
  await expect(page.locator('input[name="code"]')).toHaveValue("FAM-ABC123");
});

test("a link pointing off the app falls back to the own list", async ({ page }) => {
  await stubMagicLinkSession(page, false);
  await page.route("**/api/wishlists/me", (route) =>
    route.fulfill({ json: { items: [] } }),
  );

  await page.goto(
    `/auth/magic?token=t&redirect=${encodeURIComponent("//evil.test/")}`,
  );

  await expect(page).toHaveURL(/\/me$/);
});
