import type { Knex } from "knex";
import { z } from "zod";
import { BadRequestError, NotFoundError, ValidationError } from "./errors.js";
import { IMAGE_UNSUPPORTED } from "./middleware/image-upload.js";
import {
  isLinkedImage,
  isStoredImage,
  removeImage,
  storeImage,
} from "./uploads.js";

/** The list a user sees on Ma liste: the one of their current family, or
 *  their family-less one. */
export type ItemOwner = { userId: string; familyId: string | null | undefined };

export function scopeToOwner<T extends Knex.QueryBuilder>(
  query: T,
  { userId, familyId }: ItemOwner,
  prefix = "",
): T {
  query.where(`${prefix}user_id`, userId);
  return familyId
    ? (query.where(`${prefix}family_id`, familyId) as T)
    : (query.whereNull(`${prefix}family_id`) as T);
}

export function findOwnWishlist(dbConn: Knex, owner: ItemOwner) {
  return scopeToOwner(dbConn("wishlists"), owner).first();
}

async function ensureOwnWishlist(dbConn: Knex, owner: ItemOwner) {
  const existing = await findOwnWishlist(dbConn, owner);
  if (existing) return existing;

  const [created] = await dbConn("wishlists")
    .insert({ user_id: owner.userId, family_id: owner.familyId ?? null })
    .returning("*");
  return created;
}

/** Matches the link preview's own cap, so an image it resolved can always be
 *  stored. */
const MAX_IMAGE_URL_LENGTH = 2048;

const ItemImage = z
  .string()
  .max(MAX_IMAGE_URL_LENGTH)
  .refine((v) => v === "" || isStoredImage(v) || isLinkedImage(v), {
    message: "Lien d’image invalide",
  });

const Item = z.object({
  title: z.string().min(1),
  url: z.string().url().optional().or(z.literal("")),
  price_eur: z.coerce.number().min(0).max(99_999_999.99).optional(),
  notes: z.string().max(1000).optional(),
  priority: z.coerce.number().int().min(1).max(5).optional(),
  image_url: ItemImage.optional(),
});

/** An uploaded file always wins over a pasted link; an empty link clears the
 *  image, and an absent one leaves it untouched. */
async function resolveImage(
  file: Express.Multer.File | undefined,
  link: string | undefined,
) {
  if (file) {
    const stored = await storeImage(file.buffer);
    if (!stored) throw new BadRequestError(IMAGE_UNSUPPORTED);
    return stored;
  }
  if (link === undefined) return undefined;
  return link === "" ? null : link;
}

async function findOwnedItem(dbConn: Knex, owner: ItemOwner, itemId: string) {
  const row = await scopeToOwner(
    dbConn("wishlist_items as i")
      .join("wishlists as w", "w.id", "i.wishlist_id")
      .where("i.id", itemId),
    owner,
    "w.",
  )
    .select("i.image_url")
    .first();
  if (!row) throw new NotFoundError("item not found");
  return row;
}

export async function addItem(
  dbConn: Knex,
  owner: ItemOwner,
  body: unknown,
  file: Express.Multer.File | undefined,
) {
  const parse = Item.safeParse(body);
  if (!parse.success) throw ValidationError.fromZod(parse.error);

  const { image_url: link, ...fields } = parse.data;
  const image_url = await resolveImage(file, link);

  return dbConn.transaction(async (trx) => {
    const wishlist = await ensureOwnWishlist(trx, owner);
    const [item] = await trx("wishlist_items")
      .insert({ wishlist_id: wishlist.id, ...fields, image_url })
      .returning("*");
    return item;
  });
}

export async function updateItem(
  dbConn: Knex,
  owner: ItemOwner,
  itemId: string,
  body: unknown,
  file: Express.Multer.File | undefined,
) {
  const row = await findOwnedItem(dbConn, owner, itemId);

  const parse = Item.partial().safeParse(body);
  if (!parse.success) throw ValidationError.fromZod(parse.error);

  const { image_url: link, ...fields } = parse.data;
  const image_url = await resolveImage(file, link);
  const changes = image_url === undefined ? fields : { ...fields, image_url };

  const [updated] = await dbConn("wishlist_items")
    .where({ id: itemId })
    .update(changes)
    .returning("*");

  if (image_url !== undefined && image_url !== row.image_url)
    await removeImage(row.image_url);

  return updated;
}

export async function deleteItem(
  dbConn: Knex,
  owner: ItemOwner,
  itemId: string,
) {
  const row = await findOwnedItem(dbConn, owner, itemId);
  await dbConn("wishlist_items").where({ id: itemId }).del();
  await removeImage(row.image_url);
}
