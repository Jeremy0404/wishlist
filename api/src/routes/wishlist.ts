import { Router } from "express";
import { z } from "zod";
import { db } from "../db/knex.js";
import {
  authRequired,
  familyContext,
  mustHaveWishlistWithItem,
} from "../middleware/auth.js";

const router = Router();

// Ensure you have a wishlist in current family; create if missing
router.post("/me", authRequired, familyContext, async (req, res) => {
  const existing = await db("wishlists")
    .where({ user_id: req.user!.id, family_id: req.familyId! })
    .first();
  if (existing) return res.json(existing);
  const [wl] = await db("wishlists")
    .insert({ user_id: req.user!.id, family_id: req.familyId! })
    .returning("*");
  res.json(wl);
});

router.get("/me", authRequired, familyContext, async (req, res) => {
  const wl = await db("wishlists")
    .where({ user_id: req.user!.id, family_id: req.familyId! })
    .first();

  if (!wl) return res.json({ wishlist: null, items: [] });

  // No join on reservations = no way to infer reserved state
  const items = await db("wishlist_items")
    .where({ wishlist_id: wl.id })
    .orderBy("created_at", "desc");

  res.json({ wishlist: wl, items });
});

// Add item to my wishlist (creates wishlist if missing)
const Item = z.object({
  title: z.string().min(1),
  url: z.string().url().optional().or(z.literal("")),
  price_eur: z.coerce.number().min(0).max(99_999_999.99).optional(),
  currency: z.string().length(3).optional(),
  notes: z.string().max(1000).optional(),
  priority: z.number().int().min(1).max(5).optional(),
});

router.post("/me/items", authRequired, familyContext, async (req, res) => {
  const wl = await db("wishlists")
    .where({ user_id: req.user!.id, family_id: req.familyId! })
    .first();
  if (!wl) return res.status(400).json({ error: "Données invalides" });

  const parse = Item.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: "Données invalides" });

  const body = { ...parse.data };
  const [it] = await db("wishlist_items")
    .insert({ wishlist_id: wl.id, ...body })
    .returning("*");

  res.status(201).json(it);
});

router.patch("/me/items/:id", authRequired, familyContext, async (req, res) => {
  const { id } = req.params;
  // Ensure item belongs to me (and my family)
  const row = await db("wishlist_items as i")
    .join("wishlists as w", "w.id", "i.wishlist_id")
    .where({
      "i.id": id,
      "w.user_id": req.user!.id,
      "w.family_id": req.familyId!,
    })
    .first();
  if (!row) return res.status(404).json({ error: "not found" });

  const parse = Item.partial().safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error.flatten());

  const [updated] = await db("wishlist_items")
    .where({ id })
    .update(parse.data)
    .returning("*");
  res.json(updated);
});

router.delete(
  "/me/items/:id",
  authRequired,
  familyContext,
  async (req, res) => {
    const { id } = req.params;
    const owned = await db("wishlist_items as i")
      .join("wishlists as w", "w.id", "i.wishlist_id")
      .where({
        "i.id": id,
        "w.user_id": req.user!.id,
        "w.family_id": req.familyId!,
      })
      .first();
    if (!owned) return res.status(404).json({ error: "not found" });
    await db("wishlist_items").where({ id }).del();
    res.json({ ok: true });
  },
);

// Browse others (gate enforced)
router.get(
  "/",
  authRequired,
  familyContext,
  mustHaveWishlistWithItem,
  async (req, res) => {
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
    res.json(rows);
  },
);

// View another member’s wishlist (hide reserver identity if owner views own list—handled below)
router.get(
  "/:userId",
  authRequired,
  familyContext,
  mustHaveWishlistWithItem,
  async (req, res) => {
    const { userId } = req.params;

    // owner (userId) must be in same family
    const wl = await db("wishlists")
      .where({ user_id: userId, family_id: req.familyId! })
      .first();
    if (!wl) return res.status(404).json({ error: "not found" });

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

    res.json({
      wishlist: wl,
      owner: owner ? { id: owner.id, name: owner.name } : null,
      items,
    });
  },
);

// Reserve / unreserve / purchase
router.post(
  "/items/:id/reserve",
  authRequired,
  familyContext,
  async (req, res) => {
    const { id } = req.params;

    // Ensure the item belongs to same family and not my own
    const row = await db("wishlist_items as i")
      .join("wishlists as w", "w.id", "i.wishlist_id")
      .where({ "i.id": id, "w.family_id": req.familyId! })
      .first();
    if (!row) return res.status(404).json({ error: "not found" });

    const myWl = await db("wishlists")
      .where({ user_id: req.user!.id, family_id: req.familyId! })
      .first();
    if (myWl && myWl.id === row.wishlist_id)
      return res.status(400).json({ error: "cannot reserve your own item" });

    const existing = await db("reservations").where({ item_id: id }).first();
    if (existing) return res.status(409).json({ error: "already reserved" });

    const [r] = await db("reservations")
      .insert({
        item_id: id,
        reserver_user_id: req.user!.id,
        status: "reserved",
      })
      .returning("*");

    res.json(r);
  },
);

router.post(
  "/items/:id/unreserve",
  authRequired,
  familyContext,
  async (req, res) => {
    const { id } = req.params;
    const r = await db("reservations")
      .where({ item_id: id, reserver_user_id: req.user!.id })
      .first();
    if (!r) return res.status(404).json({ error: "not reserved by you" });
    await db("reservations").where({ id: r.id }).del();
    res.json({ ok: true });
  },
);

router.post(
  "/items/:id/purchase",
  authRequired,
  familyContext,
  async (req, res) => {
    const { id } = req.params;
    const r = await db("reservations")
      .where({ item_id: id, reserver_user_id: req.user!.id })
      .first();
    if (!r) return res.status(404).json({ error: "not reserved by you" });
    const [u] = await db("reservations")
      .where({ id: r.id })
      .update({ status: "purchased" })
      .returning("*");
    res.json(u);
  },
);

export default router;
