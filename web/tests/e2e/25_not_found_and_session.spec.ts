import { expect, test } from "@playwright/test";
import { registerUser } from "./helpers";

const NEUTRAL_500 = "rgb(161, 151, 134)";

test("an unknown URL lands on the 404 screen, not on an empty frame", async ({
  page,
}) => {
  await registerUser(page);
  await page.goto("/une-page-qui-nexiste-pas");

  const screen = page.locator('[data-test="not-found"]');
  await expect(screen).toContainText("Cette page n’existe pas");
  await expect(screen).toContainText(
    "Le lien est peut-être ancien, ou mal recopié.",
  );

  // The nav bar stays, and the block is an 880px centred column.
  await expect(page.locator("nav")).toBeVisible();
  expect((await screen.boundingBox())!.width).toBe(880);

  const icon = screen.locator("svg");
  await expect(icon).toHaveAttribute("width", "36");
  await expect(icon).toHaveCSS("color", NEUTRAL_500);

  await screen.locator('[data-test="page-message-action"]').click();
  await expect(page).toHaveURL(/\/me$/);
});

test("a guest reaching an unknown URL sees the 404, not the sign-in screen", async ({
  page,
}) => {
  await page.goto("/ni-vu-ni-connu");

  await expect(page.locator('[data-test="not-found"]')).toBeVisible();
  await expect(page).toHaveURL(/\/ni-vu-ni-connu$/);
});

test("a session that expires under the user lands on the designed screen", async ({
  page,
}) => {
  await registerUser(page);

  // The cookie is dropped behind the app's back: the next call it makes gets a
  // 401 while the app still believes someone is signed in.
  await page.context().clearCookies();
  await page.fill('[data-test="quick-add-entry"]', "Quelque chose");
  await page.click('[data-test="wishlist-add-submit"]');

  await expect(page).toHaveURL(/\/oops$/);

  const screen = page.locator('[data-test="session-expired"]');
  await expect(screen).toContainText("Quelque chose s’est mal passé");
  await expect(screen).toContainText(
    "Ta session a peut-être expiré. Reconnecte-toi pour continuer.",
  );

  await screen.locator('[data-test="page-message-action"]').click();
  await expect(page).toHaveURL(/\/$/);
});

test("a guest is never told their session expired", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-test="magic-email"]')).toBeVisible();

  // `/auth/me` answers 401 for every guest; that is not an expired session.
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('[data-test="session-expired"]')).toHaveCount(0);
  await expect(page.locator('[data-test="toast"]')).toHaveCount(0);
});
