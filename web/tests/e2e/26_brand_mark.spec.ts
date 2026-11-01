import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { registerUser } from "./helpers";

const ACCENT_700 = "rgb(143, 68, 39)";

async function expectLockup(scope: Page | Locator, root: Locator) {
  const mark = root.locator("svg");
  await expect(mark).toHaveAttribute("width", "22");
  await expect(mark).toHaveCSS("color", ACCENT_700);
  await expect(root).toHaveCSS("font-size", "20px");
  expect(
    await root.evaluate((el) => getComputedStyle(el).fontFamily),
  ).toContain("Newsreader");
  await expect(scope.getByText("Wishlist", { exact: true })).toBeVisible();
}

test("the nav carries the mark, and so does the 404 screen", async ({
  page,
}) => {
  await registerUser(page);
  await expectLockup(page, page.locator('nav [data-test="brand-lockup"]'));

  await page.goto("/une-page-qui-nexiste-pas");
  await expect(page.locator('[data-test="not-found"]')).toBeVisible();
  await expectLockup(page, page.locator('nav [data-test="brand-lockup"]'));
});

test("the favicon is the mark, not the old Illustrator export", async ({
  page,
}) => {
  const favicon = await (await page.request.get("/favicon.svg")).text();

  expect(favicon).toContain('rx="8"');
  expect(favicon).toContain("#a9512f");
  expect(favicon).not.toContain("#E8815D");
});
