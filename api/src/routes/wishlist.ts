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
import { fetchLinkPreview } from "../link-preview.js";
import { imageUpload } from "../middleware/image-upload.js";
import {
  addItem,
  deleteItem,
  findOwnWishlist,
  updateItem,
  type ItemOwner,
} from "../wishlist-items.js";

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

function callerAsOwner(req: Express.Request): ItemOwner {
  return { userId: req.user!.id, familyId: req.familyId };
}

export async function listFamilyWishlists(
  dbConn: Knex,
  familyId: string,
  userId: string,
) {
  return dbConn("family_memberships as fm")
    .join("users as u", "u.id", "fm.user_id")
    .leftJoin("wishlists as w", function () {
      this.on("w.user_id", "fm.user_id").andOn("w.family_id", "fm.family_id");
    })
    .where("fm.family_id", familyId)
    .andWhereNot("fm.user_id", userId)
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

/** Never for the owner's own eyes: only another member, or the admin screen,
 *  may see who gives what. */
export function listItemsWithReservations(dbConn: Knex, wishlistId: string) {
  return dbConn("wishlist_items as i")
    .leftJoin("reservations as r", "r.item_id", "i.id")
    .leftJoin("users as ur", "ur.id", "r.reserver_user_id")
    .select(
      "i.*",
      dbConn.raw("CASE WHEN r.id IS NULL THEN false ELSE true END AS reserved"),
      "r.status as reservation_status",
      "ur.id as reserver_user_id",
      "ur.name as reserver_name",
    )
    .where("i.wishlist_id", wishlistId)
    .orderBy("i.priority", "asc");
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
    const wl = await findOwnWishlist(db, callerAsOwner(req));

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

const PreviewRequest = z.object({
  url: z.string().url(),
});

router.post(
  "/me/items/preview",
  authRequired,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, {
      module: "wishlist",
      action: "preview-item",
    });

    const parse = PreviewRequest.safeParse(req.body);
    if (!parse.success) throw ValidationError.fromZod(parse.error);

    const preview = await fetchLinkPreview(parse.data.url);

    log.info({ resolved: preview.title !== null }, "Resolved link preview");
    res.json(preview);
  }),
);

router.post(
  "/me/items",
  authRequired,
  familyContext,
  imageUpload,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, {
      module: "wishlist",
      action: "add-item",
    });
    const item = await addItem(db, callerAsOwner(req), req.body, req.file);

    log.info(
      { wishlistId: item.wishlist_id, itemId: item.id },
      "Added wishlist item",
    );
    res.status(201).json(item);
  }),
);

router.patch(
  "/me/items/:id",
  authRequired,
  familyContext,
  imageUpload,
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, {
      module: "wishlist",
      action: "update-item",
    });
    const { id } = req.params as { id: string };
    const updated = await updateItem(
      db,
      callerAsOwner(req),
      id,
      req.body,
      req.file,
    );

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
    const { id } = req.params as { id: string };
    await deleteItem(db, callerAsOwner(req), id);
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

    const items = await listItemsWithReservations(db, wl.id);

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
