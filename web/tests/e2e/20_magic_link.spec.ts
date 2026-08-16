import { test, expect } from "@playwright/test";
import { uniqueEmail } from "./helpers";

test("the sign-in card leads with the magic link and keeps passwords one click away", async ({
  page,
}) => {
  await page.goto("/auth/login");

  await expect(page.locator('[data-test="magic-email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toHaveCount(0);

  await page.click('button[data-test="use-password"]');
  await expect(page.locator('input[name="password"]')).toBeVisible();
});

test("requesting a link confirms the inbox without revealing whether the account exists", async ({
  page,
}) => {
  await page.goto("/auth/login");

  const email = uniqueEmail();
  const requested = page.waitForResponse(
    (res) =>
      res.url().includes("/api/auth/magic-link") &&
      res.request().method() === "POST" &&
      res.status() === 200,
  );
  await page.fill('[data-test="magic-email"]', email);
  await page.click('[data-test="magic-send"]');
  await requested;

  const sent = page.locator('[data-test="magic-sent"]');
  await expect(sent).toBeVisible();
  await expect(sent).toContainText(email);
  await expect(sent).toContainText("15 minutes");
});

test("a token the API refuses lands on the expired state, not on a list", async ({
  page,
}) => {
  await page.goto("/auth/magic?token=not-a-real-token");

  await expect(page.locator('[data-test="magic-expired"]')).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/magic/);
});

test("a link with no token at all is treated the same way", async ({
  page,
}) => {
  await page.goto("/auth/magic");

  await expect(page.locator('[data-test="magic-expired"]')).toBeVisible();
});
