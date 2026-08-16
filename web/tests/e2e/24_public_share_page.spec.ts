import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { addWishlistItem, registerUser } from "./helpers";

const ACCENT_2_200 = "rgb(225, 238, 204)";
const ACCENT_2_800 = "rgb(61, 71, 43)";

async function shareOwnList(page: Page): Promise<string> {
  const published = page.waitForResponse(
    (res) => res.url().includes("/api/wishlists/me/publish") && res.ok(),
  );
  await page.click('[data-test="share-visibility-shared"]');
  await published;

  const { wishlist } = await (
    await page.request.get("/api/wishlists/me")
  ).json();
  return wishlist.public_slug;
}

test("the shared page is a read-only shop window, on the design system", async ({
  page,
}) => {
  await registerUser(page, "Alexa Chen");
  await addWishlistItem(page, {
    title: "Appareil photo Instax",
    price: 79,
    priority: 1,
  });
  await addWishlistItem(page, { title: "Cocotte en fonte", price: 220 });
  const slug = await shareOwnList(page);

  const visitor = await (
    await page.context().browser()!.newContext()
  ).newPage();
  await visitor.goto(`/share/${slug}`);

  // No navigation, no account, nothing to act on.
  await expect(visitor.locator("nav")).toHaveCount(0);
  await expect(visitor.locator('[data-test="logout"]')).toHaveCount(0);
  await expect(visitor.locator("button")).toHaveCount(0);

  // A 760px column on the flat background, not the old gradient.
  const column = visitor.locator('[data-test="public-page"]');
  expect((await column.boundingBox())!.width).toBe(760);
  await expect(visitor.locator("#app > div")).toHaveCSS(
    "background-image",
    "none",
  );

  // Brand lockup, then the owner in a 48px initials avatar.
  await expect(visitor.getByText("Wishlist", { exact: true })).toBeVisible();
  const avatar = visitor.getByLabel("Alexa Chen");
  await expect(avatar).toHaveCSS("width", "48px");
  await expect(avatar).toHaveCSS("height", "48px");
  await expect(avatar).toHaveCSS("background-color", ACCENT_2_200);
  await expect(avatar).toHaveCSS("color", ACCENT_2_800);
  await expect(avatar).toHaveText("AC");

  await expect(
    visitor.getByRole("heading", { name: "La liste de Alexa Chen" }),
  ).toBeVisible();
  await expect(
    visitor.getByText("Partagée publiquement · lecture seule"),
  ).toBeVisible();

  // Item cards carry the title and the price, and no priority at all.
  const items = visitor.locator('[data-test="public-item"]');
  await expect(items).toHaveCount(2);
  await expect(items.first()).toContainText("Appareil photo Instax");
  await expect(items.first()).toContainText("79,00");
  await expect(visitor.getByText(/Priorité/)).toHaveCount(0);
  await expect(visitor.getByText("Priorité haute")).toHaveCount(0);

  // No reservation state reaches this page — the invariant the app exists for.
  await expect(visitor.getByText(/Réserv/)).toHaveCount(0);

  // The conversion card, then the footer.
  const convert = visitor.locator('[data-test="public-convert"]');
  await expect(convert).toContainText("Envie de ta propre liste ?");
  await expect(convert).toContainText("Ça prend une dizaine de secondes");
  await convert.getByRole("link", { name: "Créer ma liste" }).click();
  await expect(visitor).toHaveURL(/\/$/);

  await visitor.goto(`/share/${slug}`);
  await expect(visitor.getByText("Propulsé par Wishlist")).toBeVisible();
});

test("a shared list with nothing on it still says so", async ({ page }) => {
  await registerUser(page, "Bob Marley");
  const item = await addWishlistItem(page, { title: "À retirer" });
  const slug = await shareOwnList(page);
  await page.request.delete(`/api/wishlists/me/items/${item.id}`);

  const visitor = await (
    await page.context().browser()!.newContext()
  ).newPage();
  await visitor.goto(`/share/${slug}`);

  await expect(visitor.locator('[data-test="empty-state"]')).toContainText(
    "Rien sur cette liste pour l’instant.",
  );
  await expect(visitor.locator('[data-test="public-convert"]')).toBeVisible();
});

test("a link that leads nowhere explains itself and still converts", async ({
  page,
}) => {
  await page.goto("/share/pas-une-liste-abcd");

  await expect(page.locator('[data-test="public-error"]')).toBeVisible();
  await expect(page.locator('[data-test="public-convert"]')).toBeVisible();
});
