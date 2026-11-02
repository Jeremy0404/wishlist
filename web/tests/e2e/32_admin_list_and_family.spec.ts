import { expect, test } from "@playwright/test";
import { registerUser, signInAsAdmin, uniqueEmail } from "./helpers";

test("the admin fills a relative's list, renames the family and retires its invite link", async ({
  page,
  browser,
}) => {
  const suffix = Date.now().toString(36);
  const familyName = `Famille Liste ${suffix}`;
  const renamed = `Famille Renommée ${suffix}`;
  const relativeName = `Papi ${suffix}`;
  const wish = `Pull ${suffix}`;

  const relativeContext = await browser.newContext();
  const relative = await relativeContext.newPage();
  await registerUser(relative, relativeName);
  const created = await relative.request.post("/api/families", {
    data: { name: familyName },
  });
  const { invite_code: oldCode } = await created.json();

  await signInAsAdmin(page);
  await page.goto("/admin");
  const family = page.locator(`[data-test="admin-family"][data-name="${familyName}"]`);
  await family.locator(`[data-test="admin-member"][data-name="${relativeName}"]`).click();

  await page.click('[data-test="admin-item-add"]');
  await page.fill('[data-test="quick-add-entry"]', wish);
  await page.click('[data-test="wishlist-add-submit"]');
  await expect(page.locator(`[data-test="admin-item"][data-title="${wish}"]`)).toBeVisible();

  await relative.goto("/me");
  const ownRow = relative.locator(`[data-test="wishlist-item"][data-title="${wish}"]`);
  await expect(ownRow).toBeVisible();

  await page.click('[data-test="admin-back"]');
  await family.locator('[data-test="admin-family-open"]').click();
  await page.fill('[data-test="admin-family-form"] input[name="family-name"]', renamed);
  await page.click('[data-test="admin-family-save"]');
  await expect(
    page.locator(`[data-test="admin-family"][data-name="${renamed}"]`),
  ).toBeVisible();

  await page.locator(`[data-test="admin-family"][data-name="${renamed}"] [data-test="admin-family-open"]`).click();
  await page.click('[data-test="admin-family-rotate"]');
  const rotation = page.waitForResponse(
    (res) => res.url().includes("/rotate-invite") && res.status() === 200,
  );
  await page.click('[data-test="inline-confirm-accept"]');
  await rotation;

  await relative.goto("/wishlists");
  await expect(relative.locator("h1")).toContainText(renamed);
  await relativeContext.close();

  const latecomerContext = await browser.newContext();
  const registered = await latecomerContext.request.post("/api/auth/register", {
    data: { name: "Retardataire", email: uniqueEmail(), password: "password123" },
  });
  expect(registered.ok()).toBeTruthy();
  const joined = await latecomerContext.request.post("/api/families/join", {
    data: { code: oldCode },
  });
  expect(joined.status()).toBe(404);
  await latecomerContext.close();
});
