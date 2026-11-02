import type { Knex } from "knex";
import { z } from "zod";
import { ForbiddenError } from "./errors.js";

export const MAX_MIN_ITEMS_TO_VIEW = 50;

export const UnlockSettings = z.object({
  minItemsToView: z.number().int().min(0).max(MAX_MIN_ITEMS_TO_VIEW),
});

export async function getMinItemsToView(dbConn: Knex): Promise<number> {
  const row = await dbConn("app_settings").select("min_items_to_view").first();
  return row?.min_items_to_view ?? 0;
}

export async function setMinItemsToView(dbConn: Knex, value: number) {
  await dbConn("app_settings")
    .insert({ id: 1, min_items_to_view: value, updated_at: dbConn.fn.now() })
    .onConflict("id")
    .merge();
}

export function missingWishes(threshold: number, wishCount: number) {
  return Math.max(0, threshold - wishCount);
}

async function countOwnWishes(dbConn: Knex, userId: string, familyId: string) {
  const row = await dbConn("wishlist_items as i")
    .join("wishlists as w", "w.id", "i.wishlist_id")
    .where({ "w.user_id": userId, "w.family_id": familyId })
    .count<{ count: string }>("i.id as count")
    .first();
  return Number(row?.count ?? 0);
}

export type UnlockStatus = { wishesRequired: number; wishesMissing: number };

export async function unlockStatus(
  dbConn: Knex,
  userId: string,
  familyId: string,
): Promise<UnlockStatus> {
  const wishesRequired = await getMinItemsToView(dbConn);
  if (wishesRequired === 0) return { wishesRequired, wishesMissing: 0 };

  const wishCount = await countOwnWishes(dbConn, userId, familyId);
  return { wishesRequired, wishesMissing: missingWishes(wishesRequired, wishCount) };
}

export async function refuseWhileListsLocked(
  dbConn: Knex,
  userId: string,
  familyId: string,
) {
  const { wishesMissing } = await unlockStatus(dbConn, userId, familyId);
  if (wishesMissing)
    throw new ForbiddenError("add more wishes to see the family's lists");
}
