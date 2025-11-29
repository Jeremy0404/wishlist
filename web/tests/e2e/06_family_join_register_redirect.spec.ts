import { expect, test } from "@playwright/test";
import { createFamily, registerUser, uniqueEmail } from "./helpers";

test("family join link keeps invite code through register flow", async ({ browser }) => {
  const ownerContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();

  await registerUser(ownerPage);
  const { inviteCode } = await createFamily(ownerPage, "Redirect Test Family");

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();

  await guestPage.goto(`/family/join?code=${inviteCode}`);
  await expect(guestPage).toHaveURL(/\/auth\/login\?redirect=.*code=/);

  await guestPage.getByRole("link", { name: "Inscription" }).click();
  await expect(guestPage).toHaveURL(/\/auth\/register\?redirect=.*code=/);

  const email = uniqueEmail();
  const password = "password123";

  await guestPage.fill('input[name="name"]', "Guest User");
  await guestPage.fill('input[name="email"]', email);
  await guestPage.fill('input[name="new-password"]', password);
  await guestPage.click('button[type="submit"]');

  await expect(guestPage).toHaveURL(new RegExp(`/family/join\\?code=${inviteCode}`));
  await expect(guestPage.locator('input[name="code"]')).toHaveValue(inviteCode);
});
