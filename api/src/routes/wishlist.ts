import crypto from "crypto";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db/knex.js";
import {
  authRequired,
  familyContext,
  mustHaveWishlistWithItem,
} from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors.js";
import { getRequestLogger } from "../logging/logger.js";

const router = Router();

router.get(
  "/me",
  authRequired,
  familyContext,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, { module: "wishlist", action: "get-own" });
    const wl = await db("wishlists")
      .where({ user_id: req.user!.id, family_id: req.familyId! })
      .first();

    if (!wl) {
      log.info("No wishlist yet for user");
      return res.json({ wishlist: null, items: [] });
    }

    const items = await db("wishlist_items")
      .where({ wishlist_id: wl.id })
      .orderBy("created_at", "desc");

    log.info({ wishlistId: wl.id, itemCount: items.length }, "Fetched wishlist");
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

function generateSlug() {
  return `santa-${crypto.randomBytes(6).toString("hex")}`;
}

async function ensureUniqueSlug(trx = db) {
  for (let i = 0; i < 5; i += 1) {
    const slug = generateSlug();
    const existing = await trx("wishlists").where({ public_slug: slug }).first();
    if (!existing) return slug;
  }
  throw new Error("unable to generate share link");
}

router.post(
  "/me/items",
  authRequired,
  familyContext,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, { module: "wishlist", action: "add-item" });
    const { id: user_id } = req.user!;
    const family_id = req.familyId!;

    const parse = Item.safeParse(req.body);
    if (!parse.success) throw ValidationError.fromZod(parse.error);

    const trx = await db.transaction();
    try {
      await trx("wishlists")
        .insert({ user_id, family_id })
        .onConflict(["user_id", "family_id"])
        .ignore();

      const wishlist = await trx("wishlists")
        .where({ user_id, family_id })
        .first();

      if (!wishlist) {
        throw new BadRequestError("Unable to ensure wishlist");
      }

      const [item] = await trx("wishlist_items")
        .insert({ wishlist_id: wishlist.id, ...parse.data })
        .returning("*");

      log.info({ wishlistId: wishlist.id, itemId: item.id }, "Added wishlist item");
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
    const log = getRequestLogger(req, { module: "wishlist", action: "update-item" });
    const { id } = req.params;
    const row = await db("wishlist_items as i")
      .join("wishlists as w", "w.id", "i.wishlist_id")
      .where({
        "i.id": id,
        "w.user_id": req.user!.id,
        "w.family_id": req.familyId!,
      })
      .first();
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
    const log = getRequestLogger(req, { module: "wishlist", action: "delete-item" });
    const { id } = req.params;
    const owned = await db("wishlist_items as i")
      .join("wishlists as w", "w.id", "i.wishlist_id")
      .where({
        "i.id": id,
        "w.user_id": req.user!.id,
        "w.family_id": req.familyId!,
      })
      .first();
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
  mustHaveWishlistWithItem,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, { module: "wishlist", action: "list-family" });
    const rows = await db("wishlists as w")
      .join("users as u", "u.id", "w.user_id")
      .where("w.family_id", req.familyId!)
      .andWhereNot("w.user_id", req.user!.id)
      .select(
        "w.id as wishlist_id",
        "u.id as user_id",
        "u.name",
        "w.created_at",
      )
      .orderBy("u.name", "asc");
    log.info({ familyId: req.familyId, count: rows.length }, "Listed family wishlists");
    res.json(rows);
  }),
);

router.post(
  "/me/publish",
  authRequired,
  familyContext,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, { module: "wishlist", action: "publish" });
    const { id: user_id } = req.user!;
    const family_id = req.familyId!;

    const trx = await db.transaction();
    try {
      await trx("wishlists")
        .insert({ user_id, family_id })
        .onConflict(["user_id", "family_id"])
        .ignore();

      const wishlist = await trx("wishlists")
        .where({ user_id, family_id })
        .first();

      if (!wishlist) throw new BadRequestError("missing wishlist");

      const public_slug = wishlist.public_slug ?? (await ensureUniqueSlug(trx));

      const [updated] = await trx("wishlists")
        .where({ id: wishlist.id })
        .update({
          public_slug,
          published_at: trx.fn.now(),
        })
        .returning("*");

      await trx.commit();
      log.info({ wishlistId: wishlist.id, slug: public_slug }, "Published wishlist");
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
    const log = getRequestLogger(req, { module: "wishlist", action: "unpublish" });
    const { id: user_id } = req.user!;
    const family_id = req.familyId!;

    const wishlist = await db("wishlists").where({ user_id, family_id }).first();
    if (!wishlist) throw new NotFoundError("wishlist not found");

    const [updated] = await db("wishlists")
      .where({ id: wishlist.id })
      .update({ public_slug: null, published_at: null })
      .returning("*");

    log.info({ wishlistId: wishlist.id }, "Unpublished wishlist");
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
      .andWhereNotNull("w.published_at")
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
  mustHaveWishlistWithItem,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, { module: "wishlist", action: "view-other" });
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
      .orderBy("i.created_at", "desc");

    log.info({ wishlistId: wl.id, ownerId: owner?.id }, "Fetched wishlist for member");
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
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, { module: "wishlist", action: "reserve-item" });
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
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, { module: "wishlist", action: "unreserve-item" });
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
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, { module: "wishlist", action: "purchase-item" });
    const { id } = req.params;
    const r = await db("reservations")
      .where({ item_id: id, reserver_user_id: req.user!.id })
      .first();
    if (!r) throw new NotFoundError("not reserved by you");
    const [u] = await db("reservations")
      .where({ id: r.id })
      .update({ status: "purchased" })
      .returning("*");
    log.info({ itemId: id, reservationId: u.id }, "Marked wishlist item as purchased");
    res.json(u);
  }),
);

export default router;
