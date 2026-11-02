import { Router } from "express";
import type { Knex } from "knex";
import { db } from "../db/knex.js";
import { adminRequired } from "../middleware/admin.js";
import { authRequired } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { NotFoundError } from "../errors.js";
import { getRequestLogger } from "../logging/logger.js";
import { listItemsWithReservations } from "./wishlist.js";

const router = Router();

router.use(authRequired, adminRequired());

const WISH_COUNT = `(
  select count(*)
  from wishlist_items i
  join wishlists w on w.id = i.wishlist_id
  where w.user_id = u.id and w.family_id is not distinct from fm.family_id
)::int as wish_count`;

export type AdminMember = {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  family_id: string | null;
  wish_count: number;
};

type Family = { id: string; name: string };

export function groupMembersByFamily(
  families: Family[],
  members: AdminMember[],
) {
  return {
    families: families.map((family) => ({
      ...family,
      members: members.filter((m) => m.family_id === family.id),
    })),
    familyless: members.filter((m) => !m.family_id),
  };
}

export function listMembers(dbConn: Knex): Promise<AdminMember[]> {
  return dbConn("users as u")
    .leftJoin("family_memberships as fm", "fm.user_id", "u.id")
    .select(
      "u.id",
      "u.name",
      "u.email",
      "u.username",
      "fm.family_id",
      dbConn.raw(WISH_COUNT),
    )
    .orderBy("u.name", "asc");
}

router.get(
  "/families",
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, { module: "admin", action: "list-families" });
    const [families, members] = await Promise.all([
      db("families").select("id", "name").orderBy("name", "asc"),
      listMembers(db),
    ]);

    log.info(
      { adminId: req.user!.id, familyCount: families.length },
      "Admin listed families",
    );
    res.json(groupMembersByFamily(families, members));
  }),
);

/** The wishlist shown is the one of the user's current family, or their
 *  family-less one: the list they see themselves on Ma liste. */
router.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const log = getRequestLogger(req, { module: "admin", action: "view-user" });
    const { id } = req.params;

    const user = await db("users")
      .select("id", "name", "email", "username")
      .where({ id })
      .first();
    if (!user) throw new NotFoundError("user not found");

    const family = await db("family_memberships as fm")
      .join("families as f", "f.id", "fm.family_id")
      .select("f.id", "f.name")
      .where("fm.user_id", id)
      .first();

    const wishlist = await db("wishlists")
      .where({ user_id: id })
      .modify((q) =>
        family ? q.where({ family_id: family.id }) : q.whereNull("family_id"),
      )
      .first();

    const items = wishlist
      ? await listItemsWithReservations(db, wishlist.id)
      : [];

    log.info({ adminId: req.user!.id, targetId: id }, "Admin viewed a user");
    res.json({ user, family: family ?? null, items });
  }),
);

export default router;
