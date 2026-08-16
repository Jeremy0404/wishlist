import { test, expect, type Page } from "@playwright/test";
import { addWishlistItem, registerUser } from "./helpers";

const ACCENT_2_600 = "rgb(114, 129, 87)";
const ON_FILL = "rgb(253, 246, 238)";

async function deleteFirstItem(page: Page) {
  const item = page.locator('[data-test="wishlist-item"]').first();
  await item.locator('[data-test="wishlist-delete"]').click();
  await item.locator('[data-test="inline-confirm-accept"]').click();
}

test("a deletion raises a success toast on the delivered pattern", async ({
  page,
}) => {
  await registerUser(page);
  await addWishlistItem(page, { title: "Théière en fonte" });

  await deleteFirstItem(page);

  const toast = page.locator('[data-test="toast"]');
  await expect(toast).toHaveAttribute("data-kind", "success");
  await expect(toast).toHaveText("Article supprimé");

  const style = await toast.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      background: s.backgroundColor,
      color: s.color,
      radius: s.borderTopLeftRadius,
      shadow: s.boxShadow,
    };
  });
  expect(style.background).toBe(ACCENT_2_600);
  expect(style.color).toBe(ON_FILL);
  expect(parseFloat(style.radius)).toBeGreaterThan(100);
  expect(style.shadow).not.toBe("none");

  // Bottom-right, inside the viewport.
  const box = (await toast.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.x + box.width).toBeGreaterThan(viewport.width / 2);
  expect(box.y + box.height).toBeGreaterThan(viewport.height / 2);
});

test("a toast can be dismissed by hand, and goes on its own otherwise", async ({
  page,
}) => {
  await registerUser(page);
  await addWishlistItem(page, { title: "Carnet de notes" });
  await addWishlistItem(page, { title: "Écharpe en laine" });

  const toast = page.locator('[data-test="toast"]');

  await deleteFirstItem(page);
  await expect(toast).toBeVisible();
  await toast.locator('[data-test="toast-dismiss"]').click();
  await expect(toast).toHaveCount(0);

  await deleteFirstItem(page);
  await expect(toast).toBeVisible();
  await expect(toast).toHaveCount(0, { timeout: 5000 });
});
