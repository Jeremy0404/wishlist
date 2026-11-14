import { expect, test } from "@playwright/test";
import {
  createFamily,
  registerUser,
  uniqueEmail,
  usePasswordForm,
} from "./helpers";

test("an invite link joins the family once the guest has registered", async ({ browser }) => {
  const ownerContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();

  await registerUser(ownerPage);
  const { inviteCode } = await createFamily(ownerPage, "Redirect Test Family");

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();

  await guestPage.goto(`/family/join?code=${inviteCode}`);
  await expect(guestPage).toHaveURL(/\/\?redirect=.*code=/);

  await usePasswordForm(guestPage);
  await guestPage.click('button[data-test="want-register"]');

  const email = uniqueEmail();
  const password = "password123";

  await guestPage.fill('input[name="name"]', "Guest User");
  await guestPage.fill('input[name="email"]', email);
  await guestPage.fill('input[name="new-password"]', password);
  await guestPage.click('button[type="submit"]');

  await expect(guestPage).toHaveURL(/\/me$/);
  await expect(guestPage.getByText("Tu as rejoint Redirect Test Family.")).toBeVisible();

  const family = await (await guestPage.request.get("/api/families/me")).json();
  expect(family?.name).toBe("Redirect Test Family");
});

test("an invite link with a dead code leaves the code on screen with the error", async ({
  page,
}) => {
  await registerUser(page);

  await page.goto("/family/join?code=DEAD-CODE00");

  await expect(page.locator('input[name="code"]')).toHaveValue("DEAD-CODE00");
  await expect(page.locator('[data-test="field-error"]')).toBeVisible();
  expect(await (await page.request.get("/api/families/me")).json()).toBeNull();
});
