import { expect, test } from "@playwright/test";
import {
  addWishlistItem,
  loginUser,
  signInAsAdmin,
  uniqueEmail,
} from "./helpers";

test("the admin creates a username account, a relative signs in with it, the admin deletes it", async ({
  page,
  browser,
}) => {
  const suffix = Date.now().toString(36);
  const familyName = `Famille Comptes ${suffix}`;
  const username = `mamie-${suffix}`;

  const ownerContext = await browser.newContext();
  const registered = await ownerContext.request.post("/api/auth/register", {
    data: { name: "Gardien", email: uniqueEmail(), password: "password123" },
  });
  expect(registered.ok()).toBeTruthy();
  const created = await ownerContext.request.post("/api/families", {
    data: { name: familyName },
  });
  expect(created.ok()).toBeTruthy();
  await ownerContext.close();

  await signInAsAdmin(page);

  await page.goto("/admin");
  await page.click('[data-test="admin-add"]');
  const createForm = page.locator('[data-test="admin-create-form"]');
  await createForm.locator('input[name="name"]').fill("Mamie");
  await createForm.locator('input[name="username"]').fill(username);
  await createForm.locator('input[name="password"]').fill("secret1");
  await createForm.locator('select[name="familyId"]').selectOption({ label: familyName });
  await page.click('[data-test="admin-create-submit"]');
  await expect(page).toHaveURL(/\/admin\/users\//);

  await page.click('[data-test="admin-password"]');
  await page.locator('[data-test="admin-password-form"] input[name="password"]').fill("secret2");
  await page.click('[data-test="admin-password-submit"]');
  await expect(page.locator('[data-test="admin-password-form"]')).toHaveCount(0);

  await page.click('[data-test="admin-edit"]');
  await page.locator('[data-test="admin-edit-form"] input[name="name"]').fill(`Mamie Jo ${suffix}`);
  await page.click('[data-test="admin-edit-submit"]');
  await expect(page.locator("h1")).toContainText(`Mamie Jo ${suffix}`);

  const relativeContext = await browser.newContext();
  const relative = await relativeContext.newPage();
  await loginUser(relative, username.toUpperCase(), "secret2");
  await relative.goto("/wishlists");
  await expect(relative.locator("h1")).toContainText(familyName);
  await addWishlistItem(relative, { title: `Plaid ${suffix}` });
  await relativeContext.close();

  await page.reload();
  await page.click('[data-test="admin-delete"]');
  await expect(page.locator('[data-test="admin-delete-impact"]')).toContainText(
    "1 envie supprimée",
  );
  await page.click('[data-test="inline-confirm-accept"]');
  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.locator(`[data-test="admin-family"][data-name="${familyName}"]`),
  ).not.toContainText("Mamie");
});
