import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  addWishlistItem,
  createFamily,
  joinFamily,
  registerUser,
} from "./helpers";

const NEUTRAL_500 = "rgb(161, 151, 134)";
const NEUTRAL_200 = "rgb(238, 231, 219)";

async function userId(page: Page): Promise<string> {
  return (await (await page.request.get("/api/auth/me")).json()).id;
}

test("an empty own list points at the field that fills it", async ({
  page,
}) => {
  await registerUser(page);

  const empty = page.locator('[data-test="empty-state"]');
  await expect(empty).toContainText("Rien ici pour l’instant.");
  await expect(empty).toHaveCSS("padding", "26.4px");

  const icon = empty.locator("svg");
  await expect(icon).toHaveAttribute("width", "26");
  await expect(icon).toHaveCSS("color", NEUTRAL_500);

  await empty.locator('[data-test="empty-add"]').click();
  await expect(page.locator('[data-test="quick-add-entry"]')).toBeFocused();
});

test("browse with nobody around invites instead of apologising", async ({
  page,
}) => {
  await registerUser(page, "Alexa Chen");
  await createFamily(page);

  await page.goto("/wishlists");

  const empty = page.locator('[data-test="empty-state"]');
  await expect(empty).toContainText(
    "Invite des proches pour commencer à parcourir.",
  );
  await expect(page.locator('[data-test="browse-card"]')).toHaveCount(0);

  await empty.locator('[data-test="browse-invite"]').click();
  await expect(page.locator('[data-test="invite-code"]')).toBeVisible();
});

test("someone else's empty list says so and offers nothing", async ({
  browser,
}) => {
  const alexa = await (await browser.newContext()).newPage();
  const bob = await (await browser.newContext()).newPage();

  await registerUser(alexa, "Alexa Chen");
  const { inviteCode } = await createFamily(alexa, "Empty Family");

  await registerUser(bob, "Bob Marley");
  await joinFamily(bob, inviteCode);

  // A wishlist row only exists once something has been on it, so Bob fills
  // his list and empties it again.
  const item = await addWishlistItem(bob, { title: "Une chose retirée" });
  await bob.request.delete(`/api/wishlists/me/items/${item.id}`);

  const bobId = await userId(bob);

  await alexa.goto(`/wishlists/${bobId}`);

  const empty = alexa.locator('[data-test="empty-state"]');
  await expect(empty).toContainText("Rien sur cette liste pour l’instant.");
  await expect(empty.locator("button")).toHaveCount(0);
  await expect(empty.locator("a")).toHaveCount(0);
});

test("a list load draws three shimmering bars, not a spinner", async ({
  page,
}) => {
  await registerUser(page);

  await page.route(
    (url) => url.pathname === "/api/wishlists/me",
    async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    },
  );

  await page.goto("/me");

  const bars = page.locator('[data-test="list-skeleton"] > span');
  await expect(bars).toHaveCount(3);

  const widths = ["80%", "60%", "70%"];
  for (const [index, width] of widths.entries()) {
    const bar = bars.nth(index);
    await expect(bar).toHaveCSS("height", "14px");
    await expect(bar).toHaveCSS("background-color", NEUTRAL_200);
    await expect(bar).toHaveAttribute("style", `width: ${width};`);
    expect(
      await bar.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          name: style.animationName,
          duration: style.animationDuration,
          timing: style.animationTimingFunction,
          iteration: style.animationIterationCount,
          radius: style.borderTopLeftRadius,
        };
      }),
    ).toEqual({
      name: "shimmer",
      duration: "1.2s",
      timing: "ease-in-out",
      iteration: "infinite",
      radius: "999px",
    });
  }

  await expect(page.locator('[data-test="list-skeleton"]')).toHaveCount(0, {
    timeout: 10000,
  });
});

test("the shimmer stops when the visitor asked for less motion", async ({
  page,
}) => {
  await registerUser(page);
  await page.emulateMedia({ reducedMotion: "reduce" });

  await page.route(
    (url) => url.pathname === "/api/wishlists/me",
    async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    },
  );

  await page.goto("/me");

  const bar = page.locator('[data-test="list-skeleton"] > span').first();
  expect(await bar.evaluate((el) => getComputedStyle(el).animationName)).toBe(
    "none",
  );
});
