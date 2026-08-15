import { Router } from "express";
import type { Knex } from "knex";
import { z } from "zod";
import { db } from "../db/knex.js";
import {
  authRequired,
  familyContext,
  familyRequired,
} from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors.js";
import { getRequestLogger } from "../logging/logger.js";
import { buildShareSlug } from "../share-slug.js";

const router = Router();

const ITEM_COUNT = `(
  select count(*) from wishlist_items i where i.wishlist_id = w.id
)::int as item_count`;

const RESERVED_BY_ME_COUNT = `(
  select count(*)
  from wishlist_items i
  join reservations r on r.item_id = i.id
  where i.wishlist_id = w.id and r.reserver_user_id = ?
)::int as reserved_by_me_count`;

type FamilyId = string | null | undefined;

function scopeToOwner<T extends Knex.QueryBuilder>(
  query: T,
  userId: string,
  familyId: FamilyId,
  prefix = "",
): T {
  query.where(`${prefix}user_id`, userId);
  return familyId
    ? (query.where(`${prefix}family_id`, familyId) as T)
    : (query.whereNull(`${prefix}family_id`) as T);
}

function findOwnWishlist(userId: string, familyId: FamilyId, trx = db) {
  return scopeToOwner(trx("wishlists"), userId, familyId).first();
}

const SLUG_ATTEMPTS = 5;

async function mintShareSlug(userId: string, trx = db) {
  const owner = await trx("users").select("name").where({ id: userId }).first();

  for (let i = 0; i < SLUG_ATTEMPTS; i += 1) {
    const slug = buildShareSlug(owner?.name ?? "");
    const taken = await trx("wishlists").where({ public_slug: slug }).first();
    if (!taken) return slug;
  }
  throw new Error("unable to generate share link");
}

async function ensureOwnWishlist(userId: string, familyId: FamilyId, trx = db) {
  const existing = await findOwnWishlist(userId, familyId, trx);
  if (existing) return existing;

  const [created] = await trx("wishlists")
    .insert({
      user_id: userId,
      family_id: familyId ?? null,
      public_slug: await mintShareSlug(userId, trx),
    })
    .returning("*");
  return created;
}

export async function listFamilyWishlists(
  dbConn: Knex,
  familyId: string,
  userId: string,
) {
  return dbConn("wishlists as w")
    .join("users as u", "u.id", "w.user_id")
    .where("w.family_id", familyId)
    .andWhereNot("w.user_id", userId)
    .select(
      "w.id as wishlist_id",
      "u.id as user_id",
      "u.name",
      "w.created_at",
      dbConn.raw(ITEM_COUNT),
      dbConn.raw(RESERVED_BY_ME_COUNT, [userId]),
    )
    .orderBy("u.name", "asc");
}

router.get(
  "/me",
  authRequired,
  familyContext,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, {
      module: "wishlist",
      action: "get-own",
    });
    const wl = await findOwnWishlist(req.user!.id, req.familyId);

    if (!wl) {
      log.info("No wishlist yet for user");
      return res.json({ wishlist: null, items: [] });
    }

    const items = await db("wishlist_items")
      .where({ wishlist_id: wl.id })
      .orderBy("created_at", "desc");

    log.info(
      { wishlistId: wl.id, itemCount: items.length },
      "Fetched wishlist",
    );
    res.json({ wishlist: wl, items });
  }),
);

const Item = z.object({
  title: z.string().min(1),
  url: z.string().url().optional().or(z.literal("")),
  price_eur: z.coerce.number().min(0).max(99_999_999.99).optional(),
  notes: z.string().max(1000).optional(),
  priority: z.number().int().min(1).max(5).optional(),
});

router.post(
  "/me/items",
  authRequired,
  familyContext,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, {
      module: "wishlist",
      action: "add-item",
    });
    const { id: user_id } = req.user!;
    const family_id = req.familyId;

    const parse = Item.safeParse(req.body);
    if (!parse.success) throw ValidationError.fromZod(parse.error);

    const trx = await db.transaction();
    try {
      const wishlist = await ensureOwnWishlist(user_id, family_id, trx);

      if (!wishlist) {
        throw new BadRequestError("Unable to ensure wishlist");
      }

      const [item] = await trx("wishlist_items")
        .insert({ wishlist_id: wishlist.id, ...parse.data })
        .returning("*");

      log.info(
        { wishlistId: wishlist.id, itemId: item.id },
        "Added wishlist item",
      );
      await trx.commit();
      return res.status(201).json(item);
    } catch (e) {
      await trx.rollback();
      throw e;
    }
  }),
);

router.patch(
  "/me/items/:id",
  authRequired,
  familyContext,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, {
      module: "wishlist",
      action: "update-item",
    });
    const { id } = req.params;
    const row = await scopeToOwner(
      db("wishlist_items as i")
        .join("wishlists as w", "w.id", "i.wishlist_id")
        .where("i.id", id),
      req.user!.id,
      req.familyId,
      "w.",
    ).first();
    if (!row) throw new NotFoundError("item not found");

    const parse = Item.partial().safeParse(req.body);
    if (!parse.success) throw ValidationError.fromZod(parse.error);

    const [updated] = await db("wishlist_items")
      .where({ id })
      .update(parse.data)
      .returning("*");
    log.info({ itemId: id }, "Updated wishlist item");
    res.json(updated);
  }),
);

router.delete(
  "/me/items/:id",
  authRequired,
  familyContext,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, {
      module: "wishlist",
      action: "delete-item",
    });
    const { id } = req.params;
    const owned = await scopeToOwner(
      db("wishlist_items as i")
        .join("wishlists as w", "w.id", "i.wishlist_id")
        .where("i.id", id),
      req.user!.id,
      req.familyId,
      "w.",
    ).first();
    if (!owned) throw new NotFoundError("item not found");
    await db("wishlist_items").where({ id }).del();
    log.info({ itemId: id }, "Deleted wishlist item");
    res.json({ ok: true });
  }),
);

router.get(
  "/",
  authRequired,
  familyContext,
  familyRequired,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, {
      module: "wishlist",
      action: "list-family",
    });
    const rows = await listFamilyWishlists(db, req.familyId!, req.user!.id);
    log.info(
      { familyId: req.familyId, count: rows.length },
      "Listed family wishlists",
    );
    res.json(rows);
  }),
);

router.post(
  "/me/publish",
  authRequired,
  familyContext,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, { module: "wishlist", action: "share" });
    const { id: user_id } = req.user!;
    const family_id = req.familyId;

    const trx = await db.transaction();
    try {
      const wishlist = await ensureOwnWishlist(user_id, family_id, trx);

      if (!wishlist) throw new BadRequestError("missing wishlist");

      const [updated] = await trx("wishlists")
        .where({ id: wishlist.id })
        .update({ published_at: trx.fn.now() })
        .returning("*");

      await trx.commit();
      log.info(
        { wishlistId: wishlist.id, slug: updated.public_slug },
        "Shared wishlist",
      );
      res.json({ wishlist: updated });
    } catch (e) {
      await trx.rollback();
      throw e;
    }
  }),
);

router.delete(
  "/me/publish",
  authRequired,
  familyContext,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, { module: "wishlist", action: "unshare" });
    const wishlist = await findOwnWishlist(req.user!.id, req.familyId);
    if (!wishlist) throw new NotFoundError("wishlist not found");

    const [updated] = await db("wishlists")
      .where({ id: wishlist.id })
      .update({ published_at: null })
      .returning("*");

    log.info({ wishlistId: wishlist.id }, "Stopped sharing wishlist");
    res.json({ wishlist: updated });
  }),
);

router.get(
  "/public/:slug",
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, { module: "wishlist", action: "public-view" });
    const { slug } = req.params;

    const wl = await db("wishlists as w")
      .leftJoin("users as u", "u.id", "w.user_id")
      .select("w.*", "u.name as owner_name")
      .where({ "w.public_slug": slug })
      .whereNotNull("w.published_at")
      .first();

    if (!wl) throw new NotFoundError("wishlist not published");

    const items = await db("wishlist_items")
      .where({ wishlist_id: wl.id })
      .orderBy("priority", "asc")
      .orderBy("created_at", "desc");

    log.info({ wishlistId: wl.id, slug }, "Fetched public wishlist");
    res.json({
      owner: wl.owner_name ? { name: wl.owner_name } : undefined,
      wishlist: { id: wl.id, published_at: wl.published_at, created_at: wl.created_at },
      items,
    });
  }),
);

router.get(
  "/:userId",
  authRequired,
  familyContext,
  familyRequired,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, {
      module: "wishlist",
      action: "view-other",
    });
    const { userId } = req.params;

    const wl = await db("wishlists")
      .where({ user_id: userId, family_id: req.familyId! })
      .first();
    if (!wl) throw new NotFoundError("wishlist not found");

    const owner = await db("users")
      .select("id", "name", "email")
      .where({ id: userId })
      .first();

    const items = await db("wishlist_items as i")
      .leftJoin("reservations as r", "r.item_id", "i.id")
      .leftJoin("users as ur", "ur.id", "r.reserver_user_id")
      .select(
        "i.*",
        db.raw("CASE WHEN r.id IS NULL THEN false ELSE true END AS reserved"),
        "r.status as reservation_status",
        "ur.id as reserver_user_id",
        "ur.name as reserver_name",
      )
      .where("i.wishlist_id", wl.id)
      .orderBy("i.priority", "asc");

    log.info(
      { wishlistId: wl.id, ownerId: owner?.id },
      "Fetched wishlist for member",
    );
    res.json({
      wishlist: wl,
      owner: owner ? { id: owner.id, name: owner.name } : null,
      items,
    });
  }),
);

router.post(
  "/items/:id/reserve",
  authRequired,
  familyContext,
  familyRequired,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, {
      module: "wishlist",
      action: "reserve-item",
    });
    const { id } = req.params;

    const row = await db("wishlist_items as i")
      .join("wishlists as w", "w.id", "i.wishlist_id")
      .where({ "i.id": id, "w.family_id": req.familyId! })
      .first();
    if (!row) throw new NotFoundError("item not found");

    const myWl = await db("wishlists")
      .where({ user_id: req.user!.id, family_id: req.familyId! })
      .first();
    if (myWl && myWl.id === row.wishlist_id)
      throw new BadRequestError("cannot reserve your own item");

    const existing = await db("reservations").where({ item_id: id }).first();
    if (existing) throw new ConflictError("already reserved");

    const [r] = await db("reservations")
      .insert({
        item_id: id,
        reserver_user_id: req.user!.id,
        status: "reserved",
      })
      .returning("*");

    log.info({ itemId: id, reservationId: r.id }, "Reserved wishlist item");
    res.json(r);
  }),
);

router.post(
  "/items/:id/unreserve",
  authRequired,
  familyContext,
  familyRequired,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, {
      module: "wishlist",
      action: "unreserve-item",
    });
    const { id } = req.params;
    const r = await db("reservations")
      .where({ item_id: id, reserver_user_id: req.user!.id })
      .first();
    if (!r) throw new NotFoundError("not reserved by you");
    await db("reservations").where({ id: r.id }).del();
    log.info({ itemId: id }, "Unreserved wishlist item");
    res.json({ ok: true });
  }),
);

router.post(
  "/items/:id/purchase",
  authRequired,
  familyContext,
  familyRequired,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, {
      module: "wishlist",
      action: "purchase-item",
    });
    const { id } = req.params;
    const r = await db("reservations")
      .where({ item_id: id, reserver_user_id: req.user!.id })
      .first();
    if (!r) throw new NotFoundError("not reserved by you");
    const [u] = await db("reservations")
      .where({ id: r.id })
      .update({ status: "purchased" })
      .returning("*");
    log.info(
      { itemId: id, reservationId: u.id },
      "Marked wishlist item as purchased",
    );
    res.json(u);
  }),
);

export default router;
