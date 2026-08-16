import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { addWishlistItem, registerUser } from "./helpers";

const ACCENT_700 = "rgb(140, 73, 26)";

async function expectLockup(scope: Page | Locator, root: Locator) {
  const mark = root.locator("svg");
  await expect(mark).toHaveAttribute("width", "22");
  await expect(mark).toHaveCSS("color", ACCENT_700);
  await expect(root).toHaveCSS("font-size", "17px");
  expect(
    await root.evaluate((el) => getComputedStyle(el).fontFamily),
  ).toContain("Caprasimo");
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

test("the shared page carries the same mark, with no nav around it", async ({
  page,
}) => {
  await registerUser(page, "Alexa Chen");
  await addWishlistItem(page, { title: "Cocotte en fonte", price: 220 });

  const published = page.waitForResponse(
    (res) => res.url().includes("/api/wishlists/me/publish") && res.ok(),
  );
  await page.click('[data-test="share-visibility-shared"]');
  await published;
  const { wishlist } = await (
    await page.request.get("/api/wishlists/me")
  ).json();

  const visitor = await (
    await page.context().browser()!.newContext()
  ).newPage();
  await visitor.goto(`/share/${wishlist.public_slug}`);

  await expect(visitor.locator("nav")).toHaveCount(0);
  await expectLockup(visitor, visitor.locator('[data-test="brand-lockup"]'));
});

test("the favicon is the mark, not the old Illustrator export", async ({
  page,
}) => {
  const favicon = await (await page.request.get("/favicon.svg")).text();

  expect(favicon).toContain('rx="8"');
  expect(favicon).toContain("#c67139");
  expect(favicon).not.toContain("#E8815D");
});
